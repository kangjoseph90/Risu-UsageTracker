<script lang="ts">
    import { onMount } from 'svelte';
    import { UsageManager } from '../../manager/usage';
    import { ProviderManager } from '../../manager/provider';
    import type { UsageRecord, UsageFilter } from '../../types';
    import { RequestType } from '../../types';
    import UsageStatistics from './UsageStatistics.svelte';
    import UsageBarChart from './UsageBarChart.svelte';
    import UsageDonutChart from './UsageDonutChart.svelte';

    export let key: number = 0;

    let records: UsageRecord[] = [];
    let providerMap: Record<string, string> = {};
    
    let stats = {
        totalCost: 0,
        totalRequests: 0,
        totalInputTokens: 0,
        totalCachedInputTokens: 0,
        totalOutputTokens: 0,
    };

    let globalMeasureBy: "tokens" | "cost" | "requests" = 'tokens';
    let globalFilterTimeRange = '';
    let globalFilterModel = '';
    let globalFilterProvider = '';
    let globalFilterRequestType = '';

    let uniqueModels: string[] = [];
    let uniqueProviders: string[] = [];
    let uniqueRequestTypes: string[] = [];

    $: if (key) {
        refreshData();
    }

    let barChartXAxis = 'day';
    let donutChartGroupBy = 'model';

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
    }> = [];
    let donutChartData: Array<{
        name: string;
        requests: number;
        tokens: number;
        cost: number;
        value: number;
        percentage: number;
    }> = [];

    onMount(() => {
        refreshData();
    });

    function refreshData() {
        records = UsageManager.getRecords([]);
        providerMap = ProviderManager.getAllProviders();
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

        records.forEach(record => {
            stats.totalInputTokens += record.inputTokens || 0;
            stats.totalCachedInputTokens += record.cachedInputTokens || 0;
            stats.totalOutputTokens += record.outputTokens || 0;
            stats.totalCost += record.totalCost || 0;
        });
    }

    function updateFilterOptions() {
        const models = new Set<string>();
        const providers = new Set<string>();
        const requestTypes = new Set<string>();

        records.forEach(record => {
            models.add(record.model);
            const providerName = providerMap[record.url] || record.url;
            providers.add(providerName);
            requestTypes.add(record.requestType || RequestType.Unknown);
        });

        uniqueModels = Array.from(models).sort();
        uniqueProviders = Array.from(providers).sort();
        uniqueRequestTypes = Array.from(requestTypes).sort();
    }

    function getGlobalFilters() {
        let timeRangeMs = 0;

        switch (globalFilterTimeRange) {
            case '1h':
                timeRangeMs = 60 * 60 * 1000;
                break;
            case '24h':
                timeRangeMs = 24 * 60 * 60 * 1000;
                break;
            case '7d':
                timeRangeMs = 7 * 24 * 60 * 60 * 1000;
                break;
            case '30d':
                timeRangeMs = 30 * 24 * 60 * 60 * 1000;
                break;
        }

        return {
            measureBy: globalMeasureBy,
            timeRangeMs,
            models: globalFilterModel ? [globalFilterModel] : [],
            providers: globalFilterProvider ? [globalFilterProvider] : [],
            requestTypes: globalFilterRequestType ? [globalFilterRequestType] : [],
        };
    }

    function buildUsageFilters(filters: {
        measureBy: string;
        timeRangeMs: number;
        models: string[];
        providers: string[];
        requestTypes: string[];
    }): UsageFilter[] {
        const usageFilters: UsageFilter[] = [];

        if (filters.timeRangeMs > 0) {
            const cutoffTime = new Date().getTime() - filters.timeRangeMs;
            usageFilters.push((record: UsageRecord) => new Date(record.timestamp).getTime() >= cutoffTime);
        }

        if (filters.models.length > 0) {
            usageFilters.push((record: UsageRecord) => filters.models.includes(record.model));
        }

        if (filters.providers.length > 0) {
            usageFilters.push((record: UsageRecord) => {
                const recordProvider = providerMap[record.url] || record.url;
                return filters.providers.includes(recordProvider);
            });
        }

        if (filters.requestTypes.length > 0) {
            usageFilters.push((record: UsageRecord) => filters.requestTypes.includes(record.requestType || RequestType.Unknown));
        }

        return usageFilters;
    }

    function updateAllCharts() {
        const filters = getGlobalFilters();
        const usageFilters = buildUsageFilters(filters);
        const filteredRecords = UsageManager.getRecords(usageFilters);

        recentRecordsDisplay = filteredRecords.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
        
        // Update bar chart
        barChartData = aggregateByTimeRange(filteredRecords, barChartXAxis, filters);
        
        // Update donut chart
        donutChartData = aggregateForDonut(filteredRecords, donutChartGroupBy, filters.measureBy, filters);
    }

    function aggregateByTimeRange(recs: UsageRecord[], timeRange: string, filters: ReturnType<typeof getGlobalFilters>) {
        const now = new Date();
        const bucketsToCreate: string[] = [];
        let currentDate = new Date(now);
        
        for (let i = 0; i < 100; i++) {
            const bucketKey = getBucketKey(currentDate, timeRange);
            bucketsToCreate.unshift(bucketKey);
            currentDate = moveToPreviousBucket(currentDate, timeRange);
        }
        
        const buckets: { [key: string]: typeof barChartData[0] } = {};
        bucketsToCreate.forEach(key => {
            buckets[key] = {
                timestamp: key,
                requests: 0,
                cachedInputTokens: 0,
                inputTokens: 0,
                outputTokens: 0,
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            };
        });
        
        recs.forEach(record => {
            const timestamp = new Date(record.timestamp);
            const bucketKey = getBucketKey(timestamp, timeRange);
            
            if (buckets[bucketKey]) {
                buckets[bucketKey].requests++;
                buckets[bucketKey].cachedInputTokens += record.cachedInputTokens || 0;
                buckets[bucketKey].inputTokens += (record.inputTokens || 0) - (record.cachedInputTokens || 0);
                buckets[bucketKey].outputTokens += record.outputTokens || 0;
                buckets[bucketKey].inputCost += record.inputCost || 0;
                buckets[bucketKey].outputCost += record.outputCost || 0;
                buckets[bucketKey].totalCost += record.totalCost || 0;
            }
        });
        
        return bucketsToCreate.map(key => buckets[key]);
    }

    function aggregateForDonut(recs: UsageRecord[], groupBy: string, measureBy: string, filters: ReturnType<typeof getGlobalFilters>) {
        const groups: { [key: string]: typeof donutChartData[0] } = {};
        
        recs.forEach(record => {
            let key: string;
            let displayName: string;
            
            switch (groupBy) {
                case 'provider':
                    key = providerMap[record.url] || record.url;
                    displayName = key;
                    break;
                case 'model':
                    key = record.model;
                    displayName = record.model;
                    break;
                case 'requestType':
                    key = record.requestType || RequestType.Unknown;
                    displayName = key;
                    break;
                default:
                    key = 'unknown';
                    displayName = 'unknown';
            }
            
            if (!groups[key]) {
                groups[key] = {
                    name: displayName,
                    requests: 0,
                    tokens: 0,
                    cost: 0,
                    value: 0,
                    percentage: 0
                };
            }
            
            groups[key].requests++;
            groups[key].tokens += (record.inputTokens || 0) + (record.outputTokens || 0);
            groups[key].cost += record.totalCost || 0;
        });
        
        const data = Object.values(groups);
        const total = data.reduce((sum, item) => {
            switch (measureBy) {
                case 'tokens': return sum + item.tokens;
                case 'cost': return sum + item.cost;
                case 'requests': return sum + item.requests;
                default: return sum + item.tokens;
            }
        }, 0);
        
        return data.map(item => {
            let value = 0;
            switch (measureBy) {
                case 'tokens': value = item.tokens; break;
                case 'cost': value = item.cost; break;
                case 'requests': value = item.requests; break;
            }
            return {
                ...item,
                value,
                percentage: total > 0 ? (value / total * 100) : 0
            };
        }).sort((a, b) => b.value - a.value);
    }

    function getBucketKey(date: Date, timeRange: string): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = date.getMinutes();
        
        switch (timeRange) {
            case '5min':
                return `${year}-${month}-${day} ${hour}:${String(Math.floor(minute / 5) * 5).padStart(2, '0')}`;
            case '15min':
                return `${year}-${month}-${day} ${hour}:${String(Math.floor(minute / 15) * 15).padStart(2, '0')}`;
            case '30min':
                return `${year}-${month}-${day} ${hour}:${String(Math.floor(minute / 30) * 30).padStart(2, '0')}`;
            case '1hour':
                return `${year}-${month}-${day} ${hour}:00`;
            case '4hour':
                return `${year}-${month}-${day} ${String(Math.floor(parseInt(hour) / 4) * 4).padStart(2, '0')}:00`;
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
            case 'month':
                return `${year}-${month}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }

    function moveToPreviousBucket(date: Date, timeRange: string): Date {
        const d = new Date(date);
        switch (timeRange) {
            case '5min':
                d.setMinutes(d.getMinutes() - 5);
                break;
            case '15min':
                d.setMinutes(d.getMinutes() - 15);
                break;
            case '30min':
                d.setMinutes(d.getMinutes() - 30);
                break;
            case '1hour':
                d.setHours(d.getHours() - 1);
                break;
            case '4hour':
                d.setHours(d.getHours() - 4);
                break;
            case 'day':
                d.setDate(d.getDate() - 1);
                break;
            case 'week':
                d.setDate(d.getDate() - 7);
                break;
            case 'month':
                d.setMonth(d.getMonth() - 1);
                break;
        }
        return d;
    }

    function handleFilterChange() {
        updateAllCharts();
    }

    function formatProvider(record: UsageRecord): string {
        return providerMap[record.url] || record.url;
    }

    function escapeHTML(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
</script>

<div class="space-y-2">
    <!-- Global Filters -->
    <div class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 mb-2 px-3 pb-3 flex-shrink-0">
        <div class="flex gap-2 text-xs flex-wrap items-center">
            <div class="flex gap-2 text-xs flex-wrap items-center">
                <span class="text-zinc-400">측정값:</span>
                <select bind:value={globalMeasureBy} on:change={handleFilterChange} class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px]">
                    <option value="tokens">토큰</option>
                    <option value="cost">비용</option>
                    <option value="requests">요청</option>
                </select>
            </div>
            <div class="flex gap-2 text-xs flex-wrap items-center">
                <span class="text-zinc-400">필터:</span>
                <select bind:value={globalFilterTimeRange} on:change={handleFilterChange} class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px]">
                    <option value="">모든 시간</option>
                    <option value="1h">1시간</option>
                    <option value="24h">24시간</option>
                    <option value="7d">7일</option>
                    <option value="30d">30일</option>
                </select>
                <select bind:value={globalFilterModel} on:change={handleFilterChange} class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px] truncate">
                    <option value="">모든 모델</option>
                    {#each uniqueModels as model}
                        <option value={model}>{model}</option>
                    {/each}
                </select>
                <select bind:value={globalFilterProvider} on:change={handleFilterChange} class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px] truncate">
                    <option value="">모든 프로바이더</option>
                    {#each uniqueProviders as provider}
                        <option value={provider}>{provider}</option>
                    {/each}
                </select>
                <select bind:value={globalFilterRequestType} on:change={handleFilterChange} class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px]">
                    <option value="">모든 타입</option>
                    {#each uniqueRequestTypes as type}
                        <option value={type}>{type}</option>
                    {/each}
                </select>
            </div>
        </div>
    </div>

    <!-- Statistics Summary -->
    <div class="p-3">
        <UsageStatistics {stats} />
    </div>

    <!-- Bar Chart -->
    <div class="p-3">
        <div class="mb-3 flex justify-between items-center">
            <h3 class="text-sm font-semibold text-zinc-100">시간대별 통계</h3>
            <select bind:value={barChartXAxis} on:change={updateAllCharts} class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs">
                <option value="5min">5분</option>
                <option value="15min">15분</option>
                <option value="30min">30분</option>
                <option value="1hour">1시간</option>
                <option value="4hour">4시간</option>
                <option value="day" selected>일별</option>
                <option value="week">주별</option>
                <option value="month">월별</option>
            </select>
        </div>
        <div class="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
            <UsageBarChart data={barChartData} measureBy={globalMeasureBy} timeRange={barChartXAxis} />
        </div>
    </div>

    <!-- Donut Chart -->
    <div class="p-3">
        <div class="mb-3 flex justify-between items-center">
            <h3 class="text-sm font-semibold text-zinc-100">분류별 통계</h3>
            <select bind:value={donutChartGroupBy} on:change={updateAllCharts} class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs">
                <option value="model">모델별</option>
                <option value="provider">프로바이더별</option>
                <option value="requestType">타입별</option>
            </select>
        </div>
        <div class="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
            <UsageDonutChart data={donutChartData} measureBy={globalMeasureBy} />
        </div>
    </div>

    <!-- Recent Records -->
    <div class="p-3">
        <h3 class="text-sm font-semibold text-zinc-100 mb-2">최근 사용 기록</h3>
        <div class="space-y-2">
            {#if recentRecordsDisplay.length === 0}
                <div class="text-center text-zinc-500 py-8">
                    사용 기록이 없습니다.
                </div>
            {:else}
                {#each recentRecordsDisplay as record (record.timestamp + record.model + record.url)}
                    {@const dateStr = new Date(record.timestamp).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    })}
                    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; overflow: hidden;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: flex-end; gap: 0.5rem; overflow: hidden;">
                                    <div style="font-size: 0.875rem; font-weight: 500; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        {escapeHTML(record.model)}
                                    </div>
                                    <div style="font-size: 0.75rem; color: #a1a1aa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                                        {escapeHTML(formatProvider(record))}
                                    </div>
                                </div>
                                <div style="font-size: 0.75rem; color: #a1a1aa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    {record.requestType || RequestType.Unknown} • {dateStr}
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.75rem; font-size: 0.75rem; flex-shrink: 0; justify-content: flex-end;">
                                <div>
                                    <div style="color: #a1a1aa;">입력</div>
                                    <div style="color: #ffffff; text-align: right;">
                                        {(record.inputTokens || 0).toLocaleString()}
                                    </div>
                                </div>
                                {#if record.cachedInputTokens > 0}
                                    <div>
                                        <div style="color: #a1a1aa;">캐시</div>
                                        <div style="color: #ffffff; text-align: right;">
                                            {record.cachedInputTokens.toLocaleString()}
                                        </div>
                                    </div>
                                {/if}
                                <div>
                                    <div style="color: #a1a1aa;">출력</div>
                                    <div style="color: #ffffff; text-align: right;">
                                        {(record.outputTokens || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div style="color: #a1a1aa;">비용</div>
                                    <div style="color: #ffffff; font-weight: 500; text-align: right;">
                                        ${(((record.inputCost || 0) + (record.outputCost || 0))).toFixed(6)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    </div>

    <!-- Last Updated Footer -->
    <div class="sticky bottom-0 z-10 bg-zinc-900 border-t border-zinc-700 pt-2 px-3 text-xs text-zinc-400 text-center">
        마지막 업데이트: {new Date(UsageManager.getLastUpdated()).toLocaleString()}
    </div>
</div>