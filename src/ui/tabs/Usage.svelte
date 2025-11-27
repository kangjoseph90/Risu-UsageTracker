<script lang="ts">
    import { onMount } from "svelte";
    import { UsageManager } from "../../manager/usage";
    import { ProviderManager } from "../../manager/provider";
    import type { UsageRecord, UsageFilter } from "../../types";
    import { RequestType } from "../../types";
    import UsageStatistics from "../components/UsageStatistics.svelte";
    import UsageBarChart from "../components/UsageBarChart.svelte";
    import UsageDonutChart from "../components/UsageDonutChart.svelte";
    import DollarDisplay from "../components/DollarDisplay.svelte";
    import RecordFilters from "../components/RecordFilters.svelte";
    import { formatString, language, type Language } from "../../lang";
    import { formatLatency } from "../../util";

    export let key: number = 0;

    let records: UsageRecord[] = [];

    let stats = {
        totalCost: 0,
        totalRequests: 0,
        totalInputTokens: 0,
        totalCachedInputTokens: 0,
        totalOutputTokens: 0,
    };

    let globalMeasureBy: "tokens" | "cost" | "requests" | "latency" | "tps" = "tokens";
    let globalFilterTimeRange: { start: Date | null; end: Date | null } = {
        start: null,
        end: null,
    };
    let globalFilterModel = "";
    let globalFilterProvider = "";
    let globalFilterRequestType = "";

    let uniqueModels: string[] = [];
    let uniqueProviders: string[] = [];
    let uniqueRequestTypes: string[] = [];

    $: if (key) {
        refreshData();
    }

    $: if ($language) {
        // Update donut chart when language changes to ensure "Other" label is translated
        if (donutChartData.length > 0) {
            const filters = getGlobalFilters();
            const usageFilters = buildUsageFilters(filters);
            const filteredRecords = UsageManager.getRecords(usageFilters);
            donutChartData = aggregateForDonut(
                filteredRecords,
                donutChartGroupBy,
                filters.measureBy,
                filters
            );
        }
    }

    let barChartXAxis = "day";
    let donutChartGroupBy = "model";

    let recentRecordsDisplay: UsageRecord[] = [];
    let barChartData: Array<{
        timestamp: string;
        requests: number;
        cachedInputTokens: number;
        inputTokens: number;
        outputTokens: number;
        inputCost: number;
        outputCost: number;
        totalCost: number;
        latency: number;
        tps: number;
    }> = [];
    let donutChartData: Array<{
        name: string;
        requests: number;
        tokens: number;
        cost: number;
        latency: number;
        tps: number;
        value: number;
        percentage: number;
    }> = [];

    onMount(() => {
        refreshData();
    });

    function refreshData() {
        records = UsageManager.getRecords([]);
        calculateStatistics();
        updateFilterOptions();
        updateAllCharts();
    }

    function calculateStatistics() {
        stats = {
            totalCost: 0,
            totalRequests: records.length,
            totalInputTokens: 0,
            totalCachedInputTokens: 0,
            totalOutputTokens: 0,
        };

        records.forEach((record) => {
            stats.totalInputTokens += record.inputTokens || 0;
            stats.totalCachedInputTokens += record.cachedInputTokens || 0;
            stats.totalOutputTokens += record.outputTokens || 0;
            stats.totalCost += record.totalCost || 0;
        });
    }

    function updateFilterOptions() {
        const models = new Set<string>();
        const providers = new Set(
            Object.values(ProviderManager.getAllProviders())
        );
        const requestTypes = new Set<string>();

        records.forEach((record) => {
            models.add(record.model);
            requestTypes.add(record.requestType || RequestType.Unknown);
        });

        uniqueModels = Array.from(models).sort();
        uniqueProviders = Array.from(providers).sort();
        uniqueRequestTypes = Array.from(requestTypes).sort();
    }

    function getGlobalFilters() {
        return {
            measureBy: globalMeasureBy,
            timeRange: globalFilterTimeRange,
            models: globalFilterModel ? [globalFilterModel] : [],
            providers: globalFilterProvider ? [globalFilterProvider] : [],
            requestTypes: globalFilterRequestType
                ? [globalFilterRequestType]
                : [],
        };
    }

    function buildUsageFilters(filters: {
        measureBy: string;
        timeRange: { start: Date | null; end: Date | null };
        models: string[];
        providers: string[];
        requestTypes: string[];
    }): UsageFilter[] {
        const usageFilters: UsageFilter[] = [];

        if (
            filters.timeRange &&
            (filters.timeRange.start || filters.timeRange.end)
        ) {
            usageFilters.push((record: UsageRecord) => {
                const recordTime = new Date(record.timestamp).getTime();
                if (
                    filters.timeRange.start &&
                    recordTime < filters.timeRange.start.getTime()
                ) {
                    return false;
                }
                if (
                    filters.timeRange.end &&
                    recordTime > filters.timeRange.end.getTime()
                ) {
                    return false;
                }
                return true;
            });
        }

        if (filters.models.length > 0) {
            usageFilters.push((record: UsageRecord) =>
                filters.models.includes(record.model)
            );
        }

        if (filters.providers.length > 0) {
            usageFilters.push((record: UsageRecord) => {
                const recordProvider = ProviderManager.getProvider(record.url);
                return filters.providers.includes(recordProvider);
            });
        }

        if (filters.requestTypes.length > 0) {
            usageFilters.push((record: UsageRecord) =>
                filters.requestTypes.includes(
                    record.requestType || RequestType.Unknown
                )
            );
        }

        return usageFilters;
    }

    function updateAllCharts() {
        const filters = getGlobalFilters();
        const usageFilters = buildUsageFilters(filters);
        const filteredRecords = UsageManager.getRecords(usageFilters);

        // Update statistics based on filtered records
        stats = {
            totalCost: 0,
            totalRequests: filteredRecords.length,
            totalInputTokens: 0,
            totalCachedInputTokens: 0,
            totalOutputTokens: 0,
        };

        filteredRecords.forEach((record) => {
            stats.totalInputTokens += record.inputTokens || 0;
            stats.totalCachedInputTokens += record.cachedInputTokens || 0;
            stats.totalOutputTokens += record.outputTokens || 0;
            stats.totalCost += record.totalCost || 0;
        });

        recentRecordsDisplay = filteredRecords
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
            )
            .slice(0, 20);

        // Update bar chart
        barChartData = aggregateByTimeRange(
            filteredRecords,
            barChartXAxis,
            filters
        );

        // Update donut chart
        donutChartData = aggregateForDonut(
            filteredRecords,
            donutChartGroupBy,
            filters.measureBy,
            filters
        );
    }

    function aggregateByTimeRange(
        recs: UsageRecord[],
        timeRange: string,
        filters: ReturnType<typeof getGlobalFilters>
    ) {
        const now = new Date();
        const bucketsToCreate: string[] = [];
        let currentDate = new Date(now);

        for (let i = 0; i < 100; i++) {
            const bucketKey = getBucketKey(currentDate, timeRange);
            bucketsToCreate.unshift(bucketKey);
            currentDate = moveToPreviousBucket(currentDate, timeRange);
        }

        const buckets: { [key: string]: (typeof barChartData)[0] & { latencySum: number, latencyCount: number, tpsSum: number, tpsCount: number } } = {};
        bucketsToCreate.forEach((key) => {
            buckets[key] = {
                timestamp: key,
                requests: 0,
                cachedInputTokens: 0,
                inputTokens: 0,
                outputTokens: 0,
                inputCost: 0,
                outputCost: 0,
                totalCost: 0,
                latency: 0,
                tps: 0,
                latencySum: 0,
                latencyCount: 0,
                tpsSum: 0,
                tpsCount: 0,
            };
        });

        recs.forEach((record) => {
            const timestamp = new Date(record.timestamp);
            const bucketKey = getBucketKey(timestamp, timeRange);

            if (buckets[bucketKey]) {
                buckets[bucketKey].requests++;
                buckets[bucketKey].cachedInputTokens +=
                    record.cachedInputTokens || 0;
                buckets[bucketKey].inputTokens +=
                    (record.inputTokens || 0) - (record.cachedInputTokens || 0);
                buckets[bucketKey].outputTokens += record.outputTokens || 0;
                buckets[bucketKey].inputCost += record.inputCost || 0;
                buckets[bucketKey].outputCost += record.outputCost || 0;
                buckets[bucketKey].totalCost += record.totalCost || 0;
                
                if (record.latency) {
                    buckets[bucketKey].latencySum += record.latency;
                    buckets[bucketKey].latencyCount++;

                    if (record.outputTokens > 0) {
                        const tps = record.outputTokens / (record.latency / 1000);
                        buckets[bucketKey].tpsSum += tps;
                        buckets[bucketKey].tpsCount++;
                    }
                }
            }
        });

        return bucketsToCreate.map((key) => {
            const bucket = buckets[key];
            if (bucket.latencyCount > 0) {
                bucket.latency = bucket.latencySum / bucket.latencyCount;
            }
            if (bucket.tpsCount > 0) {
                bucket.tps = bucket.tpsSum / bucket.tpsCount;
            }
            return bucket;
        });
    }

    function aggregateForDonut(
        recs: UsageRecord[],
        groupBy: string,
        measureBy: string,
        filters: ReturnType<typeof getGlobalFilters>
    ) {
        const groups: { [key: string]: (typeof donutChartData)[0] & { latencySum: number, latencyCount: number, tpsSum: number, tpsCount: number } } = {};

        recs.forEach((record) => {
            let key: string;
            let displayName: string;

            switch (groupBy) {
                case "provider":
                    key = ProviderManager.getProvider(record.url);
                    displayName = key;
                    break;
                case "model":
                    key = record.model;
                    displayName = record.model;
                    break;
                case "requestType":
                    key = record.requestType || RequestType.Unknown;
                    displayName = key;
                    break;
                default:
                    key = "unknown";
                    displayName = "unknown";
            }

            if (!groups[key]) {
                groups[key] = {
                    name: displayName,
                    requests: 0,
                    tokens: 0,
                    cost: 0,
                    latency: 0,
                    tps: 0,
                    latencySum: 0,
                    latencyCount: 0,
                    tpsSum: 0,
                    tpsCount: 0,
                    value: 0,
                    percentage: 0,
                };
            }

            groups[key].requests++;
            groups[key].tokens +=
                (record.inputTokens || 0) + (record.outputTokens || 0);
            groups[key].cost += record.totalCost || 0;
            
            if (record.latency) {
                groups[key].latencySum += record.latency;
                groups[key].latencyCount++;

                if (record.outputTokens > 0) {
                    const tps = record.outputTokens / (record.latency / 1000);
                    groups[key].tpsSum += tps;
                    groups[key].tpsCount++;
                }
            }
        });

        let data = Object.values(groups);
        
        // Calculate average latency and tps for each group
        data.forEach(item => {
            if (item.latencyCount > 0) {
                item.latency = item.latencySum / item.latencyCount;
            }
            if (item.tpsCount > 0) {
                item.tps = item.tpsSum / item.tpsCount;
            }
        });

        const total = data.reduce((sum, item) => {
            switch (measureBy) {
                case "tokens":
                    return sum + item.tokens;
                case "cost":
                    return sum + item.cost;
                case "requests":
                    return sum + item.requests;
                case "latency":
                    return sum + item.latency;
                case "tps":
                    return sum + item.tps;
                default:
                    return sum + item.tokens;
            }
        }, 0);

        // Calculate values and percentages
        data = data
            .map((item) => {
                let value = 0;
                switch (measureBy) {
                    case "tokens":
                        value = item.tokens;
                        break;
                    case "cost":
                        value = item.cost;
                        break;
                    case "requests":
                        value = item.requests;
                        break;
                    case "latency":
                        value = item.latency;
                        break;
                    case "tps":
                        value = item.tps;
                        break;
                }
                return {
                    ...item,
                    value,
                    percentage: total > 0 ? (value / total) * 100 : 0,
                };
            })
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);

        // Create "Other" category if there are more than 8 items
        if (data.length > 8) {
            const topItems = data.slice(0, 7);
            const otherItems = data.slice(7);

            const otherCategory = {
                name: $language.other,
                requests: otherItems.reduce(
                    (sum, item) => sum + item.requests,
                    0
                ),
                tokens: otherItems.reduce((sum, item) => sum + item.tokens, 0),
                cost: otherItems.reduce((sum, item) => sum + item.cost, 0),
                latency: 0, // Calculated below
                tps: 0, // Calculated below
                latencySum: otherItems.reduce((sum, item) => sum + item.latencySum, 0),
                latencyCount: otherItems.reduce((sum, item) => sum + item.latencyCount, 0),
                tpsSum: otherItems.reduce((sum, item) => sum + item.tpsSum, 0),
                tpsCount: otherItems.reduce((sum, item) => sum + item.tpsCount, 0),
                value: 0,
                percentage: 0,
            };

            if (otherCategory.latencyCount > 0) {
                otherCategory.latency = otherCategory.latencySum / otherCategory.latencyCount;
            }
            if (otherCategory.tpsCount > 0) {
                otherCategory.tps = otherCategory.tpsSum / otherCategory.tpsCount;
            }

            // Calculate the value for the "Other" category based on measureBy
            switch (measureBy) {
                case "tokens":
                    otherCategory.value = otherCategory.tokens;
                    break;
                case "cost":
                    otherCategory.value = otherCategory.cost;
                    break;
                case "requests":
                    otherCategory.value = otherCategory.requests;
                    break;
                case "latency":
                    otherCategory.value = otherCategory.latency;
                    break;
                case "tps":
                    otherCategory.value = otherCategory.tps;
                    break;
            }

            otherCategory.percentage =
                total > 0 ? (otherCategory.value / total) * 100 : 0;

            return [...topItems, otherCategory];
        }

        return data;
    }

    function getBucketKey(date: Date, timeRange: string): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = date.getMinutes();

        switch (timeRange) {
            case "5min":
                return `${year}-${month}-${day} ${hour}:${String(Math.floor(minute / 5) * 5).padStart(2, "0")}`;
            case "15min":
                return `${year}-${month}-${day} ${hour}:${String(Math.floor(minute / 15) * 15).padStart(2, "0")}`;
            case "30min":
                return `${year}-${month}-${day} ${hour}:${String(Math.floor(minute / 30) * 30).padStart(2, "0")}`;
            case "1hour":
                return `${year}-${month}-${day} ${hour}:00`;
            case "4hour":
                return `${year}-${month}-${day} ${String(Math.floor(parseInt(hour) / 4) * 4).padStart(2, "0")}:00`;
            case "day":
                return `${year}-${month}-${day}`;
            case "week":
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
            case "month":
                return `${year}-${month}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }

    function moveToPreviousBucket(date: Date, timeRange: string): Date {
        const d = new Date(date);
        switch (timeRange) {
            case "5min":
                d.setMinutes(d.getMinutes() - 5);
                break;
            case "15min":
                d.setMinutes(d.getMinutes() - 15);
                break;
            case "30min":
                d.setMinutes(d.getMinutes() - 30);
                break;
            case "1hour":
                d.setHours(d.getHours() - 1);
                break;
            case "4hour":
                d.setHours(d.getHours() - 4);
                break;
            case "day":
                d.setDate(d.getDate() - 1);
                break;
            case "week":
                d.setDate(d.getDate() - 7);
                break;
            case "month":
                d.setMonth(d.getMonth() - 1);
                break;
        }
        return d;
    }

    function handleFilterChange() {
        updateAllCharts();
    }

    function handleFilterApply(event: CustomEvent) {
        const { timeRange, model, provider, requestType } = event.detail;
        globalFilterTimeRange = timeRange;
        globalFilterModel = model;
        globalFilterProvider = provider;
        globalFilterRequestType = requestType;
        updateAllCharts();
    }

    function formatProvider(record: UsageRecord): string {
        return ProviderManager.getProvider(record.url);
    }

    function escapeHTML(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
</script>

<div class="flex flex-col h-full">
    <!-- Global Filters -->
    <div
        class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700/60 px-3 py-3 flex-shrink-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.25)]"
    >
        <div
            class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
        >
            <!-- Measure Group -->
            <div class="flex items-center gap-2 text-xs">
                <span class="text-zinc-400 hidden md:inline"
                    >{$language.measure}:</span
                >
                <select
                    bind:value={globalMeasureBy}
                    on:change={handleFilterChange}
                    class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px]"
                >
                    <option value="tokens">{$language.tokens}</option>
                    <option value="cost">{$language.cost}</option>
                    <option value="requests">{$language.requests}</option>
                    <option value="latency">{$language.latency}</option>
                    <option value="tps">{$language.tps}</option>
                </select>
            </div>

            <!-- Filter Group -->
            <RecordFilters
                bind:filterModel={globalFilterModel}
                bind:filterProvider={globalFilterProvider}
                bind:filterRequestType={globalFilterRequestType}
                {uniqueModels}
                {uniqueProviders}
                {uniqueRequestTypes}
                on:apply={handleFilterApply}
            />
        </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto px-3 pt-2 space-y-2">
        <!-- Statistics Summary -->
        <div class="p-3">
            <UsageStatistics {stats} />
        </div>

        <!-- Bar Chart -->
        <div class="p-3">
            <div class="mb-3 flex justify-between items-center">
                <h3 class="text-sm font-semibold text-zinc-100">
                    {$language.statisticsByTime}
                </h3>
                <select
                    bind:value={barChartXAxis}
                    on:change={updateAllCharts}
                    class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs"
                >
                    <option value="5min">{$language.fiveMinutes}</option>
                    <option value="15min">{$language.fifteenMinutes}</option>
                    <option value="30min">{$language.thirtyMinutes}</option>
                    <option value="1hour">{$language.oneHour}</option>
                    <option value="4hour">{$language.fourHours}</option>
                    <option value="day" selected>{$language.daily}</option>
                    <option value="week">{$language.weekly}</option>
                    <option value="month">{$language.monthly}</option>
                </select>
            </div>
            <div class="p-4 rounded-lg bg-zinc-800 border border-zinc-700/60">
                <UsageBarChart
                    data={barChartData}
                    measureBy={globalMeasureBy}
                    timeRange={barChartXAxis}
                />
            </div>
        </div>

        <!-- Donut Chart -->
        <div class="p-3">
            <div class="mb-3 flex justify-between items-center">
                <h3 class="text-sm font-semibold text-zinc-100">
                    {$language.statisticsByCategory}
                </h3>
                <select
                    bind:value={donutChartGroupBy}
                    on:change={updateAllCharts}
                    class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs"
                >
                    <option value="model">{$language.byModel}</option>
                    <option value="provider">{$language.byProvider}</option>
                    <option value="requestType">{$language.byType}</option>
                </select>
            </div>
            <div class="p-4 rounded-lg bg-zinc-800 border border-zinc-700/60">
                <UsageDonutChart
                    data={donutChartData}
                    measureBy={globalMeasureBy}
                />
            </div>
        </div>

        <!-- Recent Records -->
        <div class="p-3">
            <h3 class="text-sm font-semibold text-zinc-100 mb-2">
                {$language.recentUsage}
            </h3>
            <div class="space-y-2">
                {#if recentRecordsDisplay.length === 0}
                    <div class="text-center text-zinc-500 py-8">
                        {$language.noRecordsFound}
                    </div>
                {:else}
                    {#each recentRecordsDisplay as record (record.timestamp + record.model + record.url)}
                        {@const dateStr = new Date(
                            record.timestamp
                        ).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                        <div
                            class="p-3 rounded-lg bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600/60 transition-colors"
                        >
                            <div
                                class="flex space-x-1 justify-between items-start overflow-hidden"
                            >
                                <div class="flex-1 min-w-0">
                                    <div
                                        class="flex items-end gap-2 overflow-hidden"
                                    >
                                        <div
                                            class="text-sm font-medium text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis"
                                        >
                                            {escapeHTML(record.model)}
                                        </div>
                                        <div
                                            class="text-xs text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis flex-1"
                                        >
                                            {escapeHTML(formatProvider(record))}
                                        </div>
                                    </div>
                                    <div
                                        class="text-xs text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis"
                                    >
                                        {record.requestType ||
                                            RequestType.Unknown}
                                        {#if record.latency}
                                            • {formatLatency(record.latency)}
                                            {#if record.outputTokens}
                                                • {(
                                                    record.outputTokens /
                                                    (record.latency / 1000)
                                                ).toFixed(2)} TPS
                                            {/if}
                                        {/if}
                                        • {dateStr}
                                    </div>
                                </div>
                                <div
                                    class="flex gap-3 text-xs flex-shrink-0 justify-end"
                                >
                                    <div>
                                        <div class="text-zinc-400">
                                            {$language.input}
                                        </div>
                                        <div class="text-white text-right">
                                            {(
                                                record.inputTokens || 0
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                    {#if record.cachedInputTokens > 0}
                                        <div>
                                            <div class="text-zinc-400">
                                                {$language.cached}
                                            </div>
                                            <div class="text-white text-right">
                                                {record.cachedInputTokens.toLocaleString()}
                                            </div>
                                        </div>
                                    {/if}
                                    <div>
                                        <div class="text-zinc-400">
                                            {$language.output}
                                        </div>
                                        <div class="text-white text-right">
                                            {(
                                                record.outputTokens || 0
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-zinc-400">
                                            {$language.cost}
                                        </div>
                                        <DollarDisplay
                                            amount={(record.inputCost || 0) +
                                                (record.outputCost || 0)}
                                            textClass="text-white text-right"
                                            showHint={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>

    <!-- Last Updated Footer -->
    <div
        class="sticky bottom-0 z-10 bg-zinc-900 border-t border-zinc-700/60 pt-2 px-3 text-xs text-zinc-400 text-center shadow-[0_-4px_16px_0_rgba(0,0,0,0.25)]"
    >
        {formatString($language.lastUpdatedAt, {
            time: new Date(UsageManager.getLastUpdated()).toLocaleString(),
        })}
    </div>
</div>
