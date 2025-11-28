<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { ErrorManager } from "../../manager/error";
    import { EventManager, PluginEvent } from "../../manager/event";
    import type { ErrorRecord } from "../../types";
    import { RequestType } from "../../types";
    import { language, formatString } from "../../lang";
    import { Trash, AlertTriangle, Download } from "lucide-svelte";
    import { confirm, alert } from "../popup";
    import { downloadFile } from "../../util";
    import RecordFilters from "../components/RecordFilters.svelte";
    import ErrorLineChart from "../components/ErrorLineChart.svelte";

    export let key: number = 0;

    let allRecords: ErrorRecord[] = [];
    let filteredRecords: ErrorRecord[] = [];
    let selectedRecords = new Set<ErrorRecord>();

    // Filter states
    let filterTimeRange: { start: Date | null; end: Date | null } | "" = "";
    let filterModel = "";
    let filterProvider = "";
    let filterRequestType = "";
    
    // Chart state
    let chartTimeRange = "day";
    let chartData: Array<{ 
        timestamp: string;
        counts: { [code: number]: number };
        total: number;
    }> = [];

    // Pagination states
    let currentPage = 1;
    const recordsPerPage = 50;
    let totalPages = 1;

    // UI states
    let exportOptionsExpanded = false;
    let exportDropdownRef: HTMLDivElement | null = null;
    let exportButtonRef: HTMLButtonElement | null = null;

    $: uniqueProviders = getUniqueProviders(allRecords);
    $: uniqueModels = getUniqueModels(allRecords);
    $: uniqueRequestTypes = getUniqueRequestTypes(allRecords);
    $: selectedCount = selectedRecords.size;
    $: paginatedRecords = getPaginatedRecords(filteredRecords, currentPage, recordsPerPage);

    // Close dropdown when clicking outside
    function handleDocumentClick(event: MouseEvent) {
        if (
            exportOptionsExpanded &&
            exportDropdownRef &&
            !exportDropdownRef.contains(event.target as Node) &&
            !exportButtonRef?.contains(event.target as Node)
        ) {
            exportOptionsExpanded = false;
        }
    }

    $: if (exportOptionsExpanded) {
        document.addEventListener("mousedown", handleDocumentClick);
    } else {
        document.removeEventListener("mousedown", handleDocumentClick);
    }

    onMount(() => {
        refreshData();
        EventManager.on(PluginEvent.ErrorAddRecord, refreshData);
        EventManager.on(PluginEvent.ErrorRemoveRecord, refreshData);
    });

    onDestroy(() => {
        EventManager.off(PluginEvent.ErrorAddRecord, refreshData);
        EventManager.off(PluginEvent.ErrorRemoveRecord, refreshData);
    });

    $: if (key) {
        refreshData();
    }

    function refreshData() {
        allRecords = ErrorManager.getRecords();
        // Sort by timestamp descending
        allRecords.sort(
            (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
        );
        applyFilters();
    }

    function applyFilters(event?: CustomEvent) {
        if (event) {
            const { timeRange, model, provider, requestType } = event.detail;
            filterTimeRange = timeRange;
            filterModel = model;
            filterProvider = provider;
            filterRequestType = requestType;
        }

        filteredRecords = allRecords.filter((record) => {
            // Time filter
            if (filterTimeRange && (filterTimeRange.start || filterTimeRange.end)) {
                const recordTime = new Date(record.timestamp).getTime();
                if (filterTimeRange.start && recordTime < filterTimeRange.start.getTime()) return false;
                if (filterTimeRange.end && recordTime > filterTimeRange.end.getTime()) return false;
            }

            if (filterModel && record.model !== filterModel) return false;
            if (filterProvider && record.provider !== filterProvider) return false;
            if (filterRequestType && (record.requestType || RequestType.Unknown) !== filterRequestType) return false;

            return true;
        });

        // Pagination reset
        currentPage = 1;
        totalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));
        clearSelection();

        updateChart();
    }

    function updateChart() {
        chartData = aggregateErrors(filteredRecords, chartTimeRange);
    }

    function getPaginatedRecords(records: ErrorRecord[], page: number, perPage: number): ErrorRecord[] {
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        return records.slice(startIndex, endIndex);
    }

    // --- Selection Logic ---

    function clearSelection() {
        selectedRecords = new Set<ErrorRecord>();
        const selectAllCheckbox = document.getElementById("selectAllCheckbox") as HTMLInputElement;
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
    }

    function toggleRecord(record: ErrorRecord, checked: boolean) {
        const next = new Set<ErrorRecord>(selectedRecords);
        if (checked) {
            next.add(record);
        } else {
            next.delete(record);
        }
        selectedRecords = next;
        updateSelectAllCheckbox();
    }

    function selectAllRecords(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        const isChecked = target.checked;

        if (isChecked) {
            paginatedRecords.forEach(record => selectedRecords.add(record));
        } else {
            paginatedRecords.forEach(record => selectedRecords.delete(record));
        }
        selectedRecords = new Set<ErrorRecord>(selectedRecords);
    }

    function updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById("selectAllCheckbox") as HTMLInputElement;
        if (selectAllCheckbox) {
            selectAllCheckbox.checked =
                paginatedRecords.length > 0 &&
                paginatedRecords.every((r) => selectedRecords.has(r));
        }
    }

    // --- Deletion Logic ---

    async function deleteRecord(record: ErrorRecord) {
        if (await confirm($language.deleteRecordConfirm)) {
            ErrorManager.removeRecord(record);
            refreshData();
        }
    }

    async function deleteSelectedRecords() {
        if (selectedCount === 0) return;

        const confirmText = formatString($language.deleteSelectedRecordsConfirm, { count: selectedCount });
        if (await confirm(confirmText)) {
            let deletedCount = 0;
            selectedRecords.forEach(record => {
                if (ErrorManager.removeRecord(record)) {
                    deletedCount++;
                }
            });
            
            const deletedText = formatString($language.deletedRecords, { count: deletedCount });
            await alert(deletedText);
            clearSelection();
            refreshData();
        }
    }

    // --- Pagination Logic ---

    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            clearSelection();
        }
    }

    // --- Export Logic ---

    function toggleExportOptions() {
        exportOptionsExpanded = !exportOptionsExpanded;
    }

    function exportToJSON(records: ErrorRecord[]) {
        return JSON.stringify(records, null, 2);
    }

    function exportToCSV(records: ErrorRecord[]) {
        const headers = ["Timestamp", "Provider", "Model", "Type", "Status Code", "URL"];
        const rows = records.map(r => [
            r.timestamp,
            r.provider,
            r.model,
            r.requestType || "unknown",
            r.statusCode,
            r.url
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        return [headers.join(","), ...rows].join("\n");
    }

    async function exportRecordsAsJSON() {
        try {
            const jsonString = exportToJSON(filteredRecords);
            const date = new Date().toISOString().split("T")[0];
            downloadFile(jsonString, `risu-error-logs-${date}.json`, "application/json");
            await alert($language.exportSuccess);
        } catch (e) {
            await alert($language.exportFail);
        }
        exportOptionsExpanded = false;
    }

    async function exportRecordsAsCSV() {
        try {
            const csvString = exportToCSV(filteredRecords);
            const date = new Date().toISOString().split("T")[0];
            downloadFile(csvString, `risu-error-logs-${date}.csv`, "text/csv");
            await alert($language.exportSuccess);
        } catch (e) {
            await alert($language.exportFail);
        }
        exportOptionsExpanded = false;
    }

    // --- Helper Functions ---

    function aggregateErrors(recs: ErrorRecord[], timeRange: string) {
        const now = new Date();
        const bucketsToCreate: string[] = [];
        let currentDate = new Date(now);

        for (let i = 0; i < 100; i++) {
            const bucketKey = getBucketKey(currentDate, timeRange);
            bucketsToCreate.unshift(bucketKey);
            currentDate = moveToPreviousBucket(currentDate, timeRange);
        }

        const buckets: { [key: string]: (typeof chartData)[0] } = {};
        bucketsToCreate.forEach((key) => {
            buckets[key] = {
                timestamp: key,
                counts: {},
                total: 0,
            };
        });

        recs.forEach((record) => {
            const timestamp = new Date(record.timestamp);
            const bucketKey = getBucketKey(timestamp, timeRange);

            if (buckets[bucketKey]) {
                const code = record.statusCode;
                buckets[bucketKey].counts[code] = (buckets[bucketKey].counts[code] || 0) + 1;
                buckets[bucketKey].total++;
            }
        });

        return bucketsToCreate.map((key) => buckets[key]);
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
            case "5min": d.setMinutes(d.getMinutes() - 5); break;
            case "15min": d.setMinutes(d.getMinutes() - 15); break;
            case "30min": d.setMinutes(d.getMinutes() - 30); break;
            case "1hour": d.setHours(d.getHours() - 1); break;
            case "4hour": d.setHours(d.getHours() - 4); break;
            case "day": d.setDate(d.getDate() - 1); break;
            case "week": d.setDate(d.getDate() - 7); break;
            case "month": d.setMonth(d.getMonth() - 1); break;
        }
        return d;
    }

    function getStatusColor(code: number): string {
        if (code >= 500) return "text-red-500";
        if (code >= 400) return "text-orange-500";
        return "text-zinc-400";
    }

    function getUniqueProviders(records: ErrorRecord[]): string[] {
        const unique = new Set<string>();
        records.forEach(r => unique.add(r.provider));
        return Array.from(unique).sort();
    }

    function getUniqueModels(records: ErrorRecord[]): string[] {
        const unique = new Set<string>();
        records.forEach(r => unique.add(r.model));
        return Array.from(unique).sort();
    }

    function getUniqueRequestTypes(records: ErrorRecord[]): string[] {
        const unique = new Set<string>();
        records.forEach(r => unique.add(r.requestType || RequestType.Unknown));
        return Array.from(unique).sort();
    }
</script>

<div class="flex flex-col h-full">
    <!-- Fixed Top Section: Filters & Chart -->
    <div class="flex-shrink-0 bg-zinc-900 z-20 shadow-md border-b border-zinc-700/60">
        <!-- Filters Row -->
        <div class="px-3 py-3">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <RecordFilters
                    bind:filterModel
                    bind:filterProvider
                    bind:filterRequestType
                    {uniqueModels}
                    {uniqueProviders}
                    {uniqueRequestTypes}
                    on:apply={applyFilters}
                />
                <!-- Bulk Delete -->
                <div class="flex">
                    <button
                        class="w-full sm:w-auto px-3 py-1.5 bg-zinc-800 hover:bg-red-600/90 text-zinc-200 hover:text-white rounded text-sm flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click={deleteSelectedRecords}
                        disabled={selectedCount === 0}
                    >
                        <Trash size={16} />
                        <span>{formatString($language.deleteSelectedCount, { count: selectedCount })}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Chart Row (Compact) -->
        <div class="px-6 pb-3 relative">
            <div class="rounded-lg bg-zinc-800 border border-zinc-700/60 p-4">
                <ErrorLineChart
                    data={chartData}
                    timeRange={chartTimeRange}
                />
            </div>
            <!-- Time Select (Absolute Bottom Right inside Chart Container) -->
            <div class="absolute bottom-5 right-8">
                <select
                    bind:value={chartTimeRange}
                    on:change={updateChart}
                    class="bg-zinc-900/90 backdrop-blur-sm text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs shadow-lg hover:bg-zinc-800 transition-colors"
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
        </div>
    </div>

    <!-- Scrollable Content: Table -->
    <div class="flex-1 overflow-y-auto overflow-x-auto">
        {#if paginatedRecords.length === 0}
            <div class="text-center text-zinc-500 py-8">
                {$language.noRecordsFound}
            </div>
        {:else}
            <table class="min-w-full divide-y divide-zinc-700/60 table-auto">
                <thead class="bg-zinc-800 sticky top-0 z-10 shadow-lg">
                    <tr>
                        <th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 w-12">
                            <input
                                id="selectAllCheckbox"
                                type="checkbox"
                                on:change={selectAllRecords}
                                class="w-3 h-3 cursor-pointer"
                            />
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">{$language.time}</th>
                        <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">{$language.provider}</th>
                        <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">{$language.model}</th>
                        <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">{$language.type}</th>
                        <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">{$language.statusCode}</th>
                        <th class="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">{$language.actions}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-700/60 bg-zinc-900/50">
                    {#each paginatedRecords as record}
                        <tr class="hover:bg-zinc-800/50 transition-colors">
                            <td class="px-4 py-2 text-sm text-zinc-400 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedRecords.has(record)}
                                    on:change={(e) => toggleRecord(record, e.currentTarget.checked)}
                                    class="w-3 h-3 cursor-pointer"
                                />
                            </td>
                            <td class="px-4 py-2 text-sm text-zinc-400 whitespace-nowrap">
                                {new Date(record.timestamp).toLocaleString()}
                            </td>
                            <td class="px-4 py-2 text-sm text-zinc-200 whitespace-nowrap">
                                {record.provider}
                            </td>
                            <td class="px-4 py-2 text-sm text-zinc-200 whitespace-nowrap">
                                {record.model}
                            </td>
                            <td class="px-4 py-2 text-sm text-zinc-400 whitespace-nowrap">
                                {record.requestType || RequestType.Unknown}
                            </td>
                            <td class="px-4 py-2 text-sm font-mono whitespace-nowrap {getStatusColor(record.statusCode)}">
                                {record.statusCode}
                            </td>
                            <td class="px-4 py-2 text-sm whitespace-nowrap text-right">
                                <button
                                    class="text-zinc-500 hover:text-red-500 transition-colors"
                                    on:click={() => deleteRecord(record)}
                                    title={$language.delete}
                                >
                                    <Trash size={16} />
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>

    <!-- Fixed Bottom Section: Pagination & Export -->
    <div class="sticky bottom-0 z-10 bg-zinc-900 border-t border-zinc-700/60 px-3 pt-2 flex-shrink-0 shadow-[0_-4px_16px_0_rgba(0,0,0,0.25)]">
        {#if totalPages > 1}
            <div class="flex justify-center items-center gap-2 mb-2">
                <!-- Pagination Controls -->
                <button
                    class="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    on:click={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    &lt;
                </button>

                {#each Array(totalPages) as _, i}
                    {@const pageNum = i + 1}
                    {#if pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)}
                        <button
                            class="px-3 py-1 {pageNum === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-700 hover:bg-zinc-600 text-white'} rounded text-xs transition-colors"
                            on:click={() => goToPage(pageNum)}
                        >
                            {pageNum}
                        </button>
                    {:else if pageNum === currentPage - 3 || pageNum === currentPage + 3}
                        <span class="text-zinc-400 px-2">...</span>
                    {/if}
                {/each}

                <button
                    class="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    on:click={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    &gt;
                </button>
            </div>
        {/if}

        <div class="flex justify-center items-center gap-2">
            <span class="text-xs text-zinc-400">
                {formatString($language.pageInfo, {
                    current: currentPage,
                    total: totalPages,
                    count: filteredRecords.length,
                })}
            </span>
            <!-- Export Dropdown -->
            <div class="relative">
                <button
                    bind:this={exportButtonRef}
                    class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs flex items-center justify-center gap-2 transition-colors duration-200"
                    on:click={toggleExportOptions}
                >
                    <Download size={16} />
                    <span>{$language.export}</span>
                </button>
                {#if exportOptionsExpanded}
                    <div
                        bind:this={exportDropdownRef}
                        class="absolute bottom-full mb-2 left-0 p-1 w-40 bg-zinc-800 rounded-lg shadow-xl flex flex-col gap-1 text-zinc-100 border border-zinc-700/60 z-20"
                    >
                        <button
                            class="w-full text-left px-2 py-1.5 rounded text-xs transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                            on:click={exportRecordsAsJSON}
                            >{$language.exportAsJSON}</button
                        >
                        <button
                            class="w-full text-left px-2 py-1.5 rounded text-xs transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                            on:click={exportRecordsAsCSV}
                            >{$language.exportAsCSV}</button
                        >
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
