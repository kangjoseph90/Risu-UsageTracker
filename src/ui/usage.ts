import { UsageManager } from "../manager/usage";
import { ProviderManager } from "../manager/provider";
import { UsageRecord, UsageFilter, RequestType } from "../types";

interface Statistics {
    totalCost: number;
    totalRequests: number;
    totalInputTokens: number;
    totalCachedInputTokens: number;
    totalOutputTokens: number;
    byUrl: { [url: string]: any };
    byModel: { [model: string]: any };
    byRequestType: { [type: string]: any };
}

interface UIFilters {
    measureBy: string;
    timeRangeMs: number;
    models: string[];
    providers: string[];
    requestTypes: string[];
}

interface BucketData {
    timestamp: string;
    requests: number;
    cachedInputTokens: number;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
}

interface DonutDataItem {
    name: string;
    requests: number;
    tokens: number;
    cost: number;
    value: number;
    percentage: number;
}

export class UsageUI {
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    render() {
        const records = UsageManager.getRecords([]);
        const stats = this.calculateStatistics(records);

        this.container.innerHTML = `
            <!-- Global Filters (Sticky) -->
            <div class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 mb-2 p-3 flex-shrink-0">
                <div class="flex gap-2 text-xs flex-wrap items-center">
                    <div class="flex gap-2 text-xs flex-wrap items-center">
                        <span class="text-zinc-400">측정값:</span>
                        <select id="globalMeasureBy" class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px]">
                            <option value="tokens">토큰</option>
                            <option value="cost">비용</option>
                            <option value="requests">요청</option>
                        </select>
                    </div>
                    <div class="flex gap-2 text-xs flex-wrap items-center">
                        <span class="text-zinc-400">필터:</span>
                        <select id="globalFilterTimeRange" class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px]">
                            <option value="">모든 시간</option>
                            <option value="1h">1시간</option>
                            <option value="24h">24시간</option>
                            <option value="7d">7일</option>
                            <option value="30d">30일</option>
                        </select>
                        <select id="globalFilterModel" class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px] truncate">
                            <option value="">모든 모델</option>
                        </select>
                        <select id="globalFilterProvider" class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px] truncate">
                            <option value="">모든 프로바이더</option>
                        </select>
                        <select id="globalFilterRequestType" class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs max-w-[120px]">
                            <option value="">모든 타입</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Statistics Summary -->
            <div id="statisticsSummary" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3">
                ${this.renderStatisticsSummary(stats)}
            </div>

            <!-- Bar Chart -->
            <div class="mb-6 p-3">
                <div class="mb-3 flex justify-between items-center">
                    <h3 class="text-sm font-semibold text-zinc-100">시간대별 통계</h3>
                    <select id="barChartXAxis" class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs">
                        <option value="day" selected>일별</option>
                        <option value="5min">5분</option>
                        <option value="15min">15분</option>
                        <option value="30min">30분</option>
                        <option value="1hour">1시간</option>
                        <option value="4hour">4시간</option>
                        <option value="week">주별</option>
                        <option value="month">월별</option>
                    </select>
                </div>
                <div id="barChartContainer" class="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
                    ${this.renderBarChart(this.aggregateByTimeRange(records, 'day', {}), 'tokens', 'day')}
                </div>
            </div>

            <!-- Donut Chart -->
            <div class="mb-6 p-3">
                <div class="mb-3 flex justify-between items-center">
                    <h3 class="text-sm font-semibold text-zinc-100">분류별 통계</h3>
                    <select id="donutChartGroupBy" class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs">
                        <option value="model">모델별</option>
                        <option value="url">프로바이더별</option>
                        <option value="requestType">타입별</option>
                    </select>
                </div>
                <div id="donutChartContainer" class="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
                    ${this.renderDonutChart(this.aggregateForDonut(records, 'model', 'tokens', {}), 'model', 'tokens')}
                </div>
            </div>

            <!-- Recent Records -->
            <div class="mb-6 p-3">
                <h3 class="text-sm font-semibold text-zinc-100 mb-2">최근 사용 기록</h3>
                <div id="recentRecordsContainer" class="space-y-2">
                    ${this.renderRecords(records)}
                </div>
            </div>

            <!-- Last Updated Footer (Sticky) -->
            <div class="sticky bottom-0 z-10 bg-zinc-900 border-t border-zinc-700 pt-2 px-3 text-xs text-zinc-400 text-center">
                마지막 업데이트: ${this.formatLastUpdated(UsageManager.getLastUpdated())}
            </div>
        `;

        this.attachEventListeners();
    }

    private renderStatisticsSummary(stats: Statistics): string {
        return `
            <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                <div class="text-xs text-zinc-300 mb-1">총 비용</div>
                <div class="text-xl font-bold text-white">$${stats.totalCost.toFixed(4)}</div>
            </div>
            <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                <div class="text-xs text-zinc-300 mb-1">총 요청</div>
                <div class="text-xl font-bold text-white">${stats.totalRequests.toLocaleString()}</div>
            </div>
            <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                <div class="text-xs text-zinc-300 mb-1">입력 토큰</div>
                <div class="text-xl font-bold text-white">${stats.totalInputTokens.toLocaleString()}</div>
            </div>
            <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                <div class="text-xs text-zinc-300 mb-1">출력 토큰</div>
                <div class="text-xl font-bold text-white">${stats.totalOutputTokens.toLocaleString()}</div>
            </div>
        `;
    }

    private calculateStatistics(records: UsageRecord[]): Statistics {
        const stats: Statistics = {
            totalRequests: records.length,
            totalInputTokens: 0,
            totalCachedInputTokens: 0,
            totalOutputTokens: 0,
            totalCost: 0,
            byUrl: {},
            byModel: {},
            byRequestType: {}
        };

        records.forEach(record => {
            stats.totalInputTokens += record.inputTokens || 0;
            stats.totalCachedInputTokens += record.cachedInputTokens || 0;
            stats.totalOutputTokens += record.outputTokens || 0;
            stats.totalCost += record.totalCost || 0;

            // URL stats
            if (!stats.byUrl[record.url]) {
                stats.byUrl[record.url] = {
                    requests: 0,
                    cost: 0,
                    inputTokens: 0,
                    cachedInputTokens: 0,
                    outputTokens: 0
                };
            }
            stats.byUrl[record.url].requests++;
            stats.byUrl[record.url].cost += record.totalCost || 0;
            stats.byUrl[record.url].inputTokens += record.inputTokens || 0;
            stats.byUrl[record.url].cachedInputTokens += record.cachedInputTokens || 0;
            stats.byUrl[record.url].outputTokens += record.outputTokens || 0;

            // Model stats
            if (!stats.byModel[record.model]) {
                stats.byModel[record.model] = {
                    requests: 0,
                    cost: 0,
                    inputTokens: 0,
                    cachedInputTokens: 0,
                    outputTokens: 0
                };
            }
            stats.byModel[record.model].requests++;
            stats.byModel[record.model].cost += record.totalCost || 0;
            stats.byModel[record.model].inputTokens += record.inputTokens || 0;
            stats.byModel[record.model].cachedInputTokens += record.cachedInputTokens || 0;
            stats.byModel[record.model].outputTokens += record.outputTokens || 0;

            // RequestType stats
            const requestType = record.requestType || RequestType.Unknown;
            if (!stats.byRequestType[requestType]) {
                stats.byRequestType[requestType] = {
                    requests: 0,
                    cost: 0,
                    inputTokens: 0,
                    cachedInputTokens: 0,
                    outputTokens: 0
                };
            }
            stats.byRequestType[requestType].requests++;
            stats.byRequestType[requestType].cost += record.totalCost || 0;
            stats.byRequestType[requestType].inputTokens += record.inputTokens || 0;
            stats.byRequestType[requestType].cachedInputTokens += record.cachedInputTokens || 0;
            stats.byRequestType[requestType].outputTokens += record.outputTokens || 0;
        });

        return stats;
    }

    private aggregateByTimeRange(records: UsageRecord[], timeRange: string, filters: Partial<UIFilters>): BucketData[] {
        const filtered = this.applyFilters(records, filters);
        
        const now = new Date();
        const bucketsToCreate: string[] = [];
        let currentDate = new Date(now);
        
        for (let i = 0; i < 100; i++) {
            const bucketKey = this.getBucketKey(currentDate, timeRange);
            bucketsToCreate.unshift(bucketKey);
            currentDate = this.moveToPreviousBucket(currentDate, timeRange);
        }
        
        const buckets: { [key: string]: BucketData } = {};
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
        
        filtered.forEach(record => {
            const timestamp = new Date(record.timestamp);
            const bucketKey = this.getBucketKey(timestamp, timeRange);
            
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

    private moveToPreviousBucket(date: Date, timeRange: string): Date {
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

    private getBucketKey(date: Date, timeRange: string): string {
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

    private applyFilters(records: UsageRecord[], filters: Partial<UIFilters>): UsageRecord[] {
        return records.filter(record => {
            if (filters.providers && filters.providers.length > 0) {
                if (!filters.providers.includes(record.url)) return false;
            }
            if (filters.models && filters.models.length > 0) {
                if (!filters.models.includes(record.model)) return false;
            }
            if (filters.requestTypes && filters.requestTypes.length > 0) {
                if (!filters.requestTypes.includes(record.requestType || RequestType.Unknown)) return false;
            }
            return true;
        });
    }

    private aggregateForDonut(records: UsageRecord[], groupBy: string, measureBy: string, filters: Partial<UIFilters>): DonutDataItem[] {
        const filtered = this.applyFilters(records, filters);
        const groups: { [key: string]: DonutDataItem } = {};
        
        filtered.forEach(record => {
            let key: string;
            let displayName: string;
            
            switch (groupBy) {
                case 'url':
                    key = record.url;
                    displayName = ProviderManager.getProvider(record.url);
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

    private renderBarChart(data: BucketData[], yAxis: string, xAxis: string): string {
        let maxValue = 0;
        data.forEach(bucket => {
            let value = 0;
            switch (yAxis) {
                case 'tokens':
                    value = bucket.cachedInputTokens + bucket.inputTokens + bucket.outputTokens;
                    break;
                case 'cost':
                    value = bucket.totalCost;
                    break;
                case 'requests':
                    value = bucket.requests;
                    break;
            }
            maxValue = Math.max(maxValue, value);
        });

        if (maxValue === 0 || data.length === 0) {
            return '<div style="text-align: center; color: #a1a1aa; padding: 2rem 0;">데이터가 없습니다.</div>';
        }

        maxValue *= 1.05;

        const yGridLines = this.calculateGridLines(maxValue);
        const chartHeight = 200;
        const barWidth = 40;
        const spacing = 8;
        const yAxisWidth = 45;
        const chartWidth = data.length * (barWidth + spacing) + spacing;
        const rightPadding = 20;

        let yAxisLabelsHTML = '';
        let gridLinesHTML = '';
        yGridLines.forEach(gridValue => {
            const y = chartHeight - (gridValue / maxValue) * chartHeight;
            const label = gridValue >= 1000 ? (gridValue / 1000).toFixed(0) + 'K' : gridValue.toString();
            yAxisLabelsHTML += `<text x="${yAxisWidth - 10}" y="${y + 3}" fill="#a1a1aa" font-size="10" text-anchor="end">${label}</text>`;
            gridLinesHTML += `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#505050" stroke-width="1" stroke-dasharray="2,2"/>`;
        });

        const zeroLine = `<line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#505050" stroke-width="1.5"/>`;

        const barsHTML = data.map((bucket, index) => {
            const x = spacing + index * (barWidth + spacing);
            let bars = '';
            let currentY = chartHeight;

            if (yAxis === 'tokens') {
                const cachedHeight = (bucket.cachedInputTokens / maxValue) * chartHeight;
                const inputHeight = (bucket.inputTokens / maxValue) * chartHeight;
                const outputHeight = (bucket.outputTokens / maxValue) * chartHeight;

                if (cachedHeight > 0) {
                    currentY -= cachedHeight;
                    bars += `<rect x="${x}" y="${currentY}" width="${barWidth}" height="${cachedHeight}" fill="#3b82f6" rx="2"/>`;
                }
                if (inputHeight > 0) {
                    currentY -= inputHeight;
                    bars += `<rect x="${x}" y="${currentY}" width="${barWidth}" height="${inputHeight}" fill="#8b5cf6" rx="2"/>`;
                }
                if (outputHeight > 0) {
                    currentY -= outputHeight;
                    bars += `<rect x="${x}" y="${currentY}" width="${barWidth}" height="${outputHeight}" fill="#f97316" rx="2"/>`;
                }
            } else if (yAxis === 'cost') {
                const inputCostHeight = (bucket.inputCost / maxValue) * chartHeight;
                const outputCostHeight = (bucket.outputCost / maxValue) * chartHeight;

                if (inputCostHeight > 0) {
                    currentY -= inputCostHeight;
                    bars += `<rect x="${x}" y="${currentY}" width="${barWidth}" height="${inputCostHeight}" fill="#8b5cf6" rx="2"/>`;
                }
                if (outputCostHeight > 0) {
                    currentY -= outputCostHeight;
                    bars += `<rect x="${x}" y="${currentY}" width="${barWidth}" height="${outputCostHeight}" fill="#f97316" rx="2"/>`;
                }
            } else {
                const height = (bucket.requests / maxValue) * chartHeight;
                currentY -= height;
                bars += `<rect x="${x}" y="${currentY}" width="${barWidth}" height="${height}" fill="#3b82f6" rx="2"/>`;
            }

            const label = this.formatBucketLabel(bucket.timestamp, xAxis);
            const labelY = chartHeight + 15;
            bars += `<text x="${x + barWidth/2}" y="${labelY}" fill="#a1a1aa" font-size="11" text-anchor="middle">${label}</text>`;

            return bars;
        }).join('');

        let legend = '';
        if (yAxis === 'tokens') {
            legend = `
                <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: #d4d4d8; margin-top: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;"><span style="width: 0.75rem; height: 0.75rem; background-color: #3b82f6; border-radius: 0.25rem; display: inline-block;"></span> 캐시</div>
                    <div style="display: flex; align-items: center; gap: 0.25rem;"><span style="width: 0.75rem; height: 0.75rem; background-color: #8b5cf6; border-radius: 0.25rem; display: inline-block;"></span> 일반 입력</div>
                    <div style="display: flex; align-items: center; gap: 0.25rem;"><span style="width: 0.75rem; height: 0.75rem; background-color: #f97316; border-radius: 0.25rem; display: inline-block;"></span> 출력</div>
                </div>
            `;
        } else if (yAxis === 'cost') {
            legend = `
                <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: #d4d4d8; margin-top: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;"><span style="width: 0.75rem; height: 0.75rem; background-color: #8b5cf6; border-radius: 0.25rem; display: inline-block;"></span> 입력 비용</div>
                    <div style="display: flex; align-items: center; gap: 0.25rem;"><span style="width: 0.75rem; height: 0.75rem; background-color: #f97316; border-radius: 0.25rem; display: inline-block;"></span> 출력 비용</div>
                </div>
            `;
        } else {
            legend = `
                <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: #d4d4d8; margin-top: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;"><span style="width: 0.75rem; height: 0.75rem; background-color: #3b82f6; border-radius: 0.25rem; display: inline-block;"></span> 요청</div>
                </div>
            `;
        }
        
        return `
            <div style="display: flex; border: 1px solid #404040; border-radius: 0.375rem; overflow: hidden;">
                <div style="width: ${yAxisWidth}px; flex-shrink: 0; background-color: #202023; border-right: 1px solid #404040;">
                    <svg width="${yAxisWidth}" height="${chartHeight + 30}" style="display: block;">
                        ${yAxisLabelsHTML}
                    </svg>
                </div>
                <div id="bar-chart-scroll-container" style="overflow-x: auto; flex: 1;">
                    <svg width="${chartWidth + rightPadding}" height="${chartHeight + 30}" style="display: block;">
                        <g>
                            ${gridLinesHTML}
                            ${zeroLine}
                            ${barsHTML}
                        </g>
                    </svg>
                </div>
            </div>
            ${legend}
        `;
    }

    private calculateGridLines(maxValue: number): number[] {
        if (maxValue === 0) return [0];

        const exponent = Math.floor(Math.log10(maxValue));
        const mantissa = maxValue / Math.pow(10, exponent);

        let interval: number;
        if (mantissa <= 2) {
            interval = Math.pow(10, exponent);
        } else if (mantissa <= 5) {
            interval = 2 * Math.pow(10, exponent);
        } else {
            interval = 5 * Math.pow(10, exponent);
        }

        const generateLines = (step: number): number[] => {
            const lines: number[] = [];
            let count = 1;
            while (true) {
                const value = step * count;
                if (value >= maxValue) break;
                const rounded = Math.round(value * 1e10) / 1e10;
                lines.push(rounded);
                count++;
            }
            return lines;
        };

        let lines = generateLines(interval);

        if (lines.length < 2) {
            lines = generateLines(interval / 2);
        }

        return lines;
    }

    private formatBucketLabel(timestamp: string, timeRange: string): string {
        if (timeRange === 'month') {
            return timestamp.substring(5, 7) + '월';
        } else if (timeRange === 'week') {
            return timestamp.substring(5).replace('-', '/');
        } else if (timeRange === 'day') {
            return timestamp.substring(5).replace('-', '/');
        } else if (timeRange === '1hour' || timeRange === '4hour') {
            return timestamp.substring(11, 16);
        } else {
            return timestamp.substring(11, 16);
        }
    }

    private renderDonutChart(data: DonutDataItem[], groupBy: string, measureBy: string): string {
        if (data.length === 0) {
            return '<div style="text-align: center; color: #a1a1aa; padding: 2rem 0;">데이터가 없습니다.</div>';
        }

        const size = 200;
        const center = size / 2;
        const radius = 70;
        const innerRadius = 45;

        const colors = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#eab308', '#ec4899', '#06b6d4'];
        
        let currentAngle = -90;
        const segments = data.slice(0, 8).map((item, index) => {
            const percentage = item.percentage;
            const angle = (percentage / 100) * 360;
            
            if (angle >= 359.9) {
                const midAngle = currentAngle + 180;
                const startAngle = currentAngle * Math.PI / 180;
                const midAngleRad = midAngle * Math.PI / 180;
                const endAngle = (currentAngle + 360) * Math.PI / 180;

                const x1 = center + radius * Math.cos(startAngle);
                const y1 = center + radius * Math.sin(startAngle);
                const x2 = center + radius * Math.cos(midAngleRad);
                const y2 = center + radius * Math.sin(midAngleRad);
                const x3 = center + innerRadius * Math.cos(midAngleRad);
                const y3 = center + innerRadius * Math.sin(midAngleRad);
                const x4 = center + innerRadius * Math.cos(startAngle);
                const y4 = center + innerRadius * Math.sin(startAngle);

                const path1 = `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 1 0 ${x4} ${y4} Z`;

                const x5 = center + radius * Math.cos(midAngleRad);
                const y5 = center + radius * Math.sin(midAngleRad);
                const x6 = center + radius * Math.cos(endAngle);
                const y6 = center + radius * Math.sin(endAngle);
                const x7 = center + innerRadius * Math.cos(endAngle);
                const y7 = center + innerRadius * Math.sin(endAngle);
                const x8 = center + innerRadius * Math.cos(midAngleRad);
                const y8 = center + innerRadius * Math.sin(midAngleRad);

                const path2 = `M ${x5} ${y5} A ${radius} ${radius} 0 1 1 ${x6} ${y6} L ${x7} ${y7} A ${innerRadius} ${innerRadius} 0 1 0 ${x8} ${y8} Z`;

                return `<path d="${path1}" fill="${colors[index % colors.length]}" opacity="0.9"/><path d="${path2}" fill="${colors[index % colors.length]}" opacity="0.9"/>`;
            }

            const startAngle = currentAngle * Math.PI / 180;
            const endAngle = (currentAngle + angle) * Math.PI / 180;

            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);
            const x3 = center + innerRadius * Math.cos(endAngle);
            const y3 = center + innerRadius * Math.sin(endAngle);
            const x4 = center + innerRadius * Math.cos(startAngle);
            const y4 = center + innerRadius * Math.sin(startAngle);

            const largeArc = angle > 180 ? 1 : 0;

            const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

            currentAngle += angle;

            return `<path d="${path}" fill="${colors[index % colors.length]}" opacity="0.9"/>`;
        }).join('');

        const legend = data.slice(0, 8).map((item, index) => {
            const valueStr = measureBy === 'cost' 
                ? `$${item.value.toFixed(2)}`
                : measureBy === 'tokens'
                ? `${(item.value / 1000).toFixed(1)}K`
                : item.value;

            return `
                <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <span style="width: 0.75rem; height: 0.75rem; border-radius: 0.25rem; background-color: ${colors[index % colors.length]}; display: inline-block; flex-shrink: 0;"></span>
                    <span style="color: #d4d4d8; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;" title="${this.escapeHTML(item.name)}">${this.escapeHTML(item.name)}</span>
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0;">
                        <span style="color: #a1a1aa;">${item.percentage.toFixed(1)}%</span>
                        <span style="color: #ffffff; font-weight: 500;">${valueStr}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="display: flex; gap: 2rem; align-items: center; flex-wrap: wrap;">
                <div style="display: flex; justify-content: center; flex-shrink: 0;">
                    <svg width="${size}" height="${size}">
                        ${segments}
                    </svg>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0; flex: 1; min-width: 200px; justify-content: center;">
                    ${legend}
                </div>
            </div>
        `;
    }

    private renderRecords(records: UsageRecord[]): string {
        if (records.length === 0) {
            return '<div style="text-align: center; color: #a1a1aa; padding: 2rem 0;">사용 기록이 없습니다.</div>';
        }

        const sortedRecords = records.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const recentRecords = sortedRecords.slice(0, 20);

        return recentRecords.map(record => {
            const date = new Date(record.timestamp);
            const dateStr = date.toLocaleString('ko-KR', { 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
            
            const providerName = ProviderManager.getProvider(record.url);

            return `
                <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; overflow: hidden;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: flex-end; gap: 0.5rem; overflow: hidden;">
                                <div style="font-size: 0.875rem; font-weight: 500; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHTML(record.model)}</div>
                                <div style="font-size: 0.75rem; color: #a1a1aa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${this.escapeHTML(providerName)}</div>
                            </div>
                            <div style="font-size: 0.75rem; color: #a1a1aa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${record.requestType || RequestType.Unknown} • ${dateStr}</div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; font-size: 0.75rem; flex-shrink: 0; justify-content: flex-end;">
                            <div>
                                <div style="color: #a1a1aa;">입력</div>
                                <div style="color: #ffffff; text-align: right;">${(record.inputTokens || 0).toLocaleString()}</div>
                            </div>
                            ${record.cachedInputTokens > 0 ? `
                            <div>
                                <div style="color: #a1a1aa;">캐시</div>
                                <div style="color: #ffffff; text-align: right;">${record.cachedInputTokens.toLocaleString()}</div>
                            </div>
                            ` : ''}
                            <div>
                                <div style="color: #a1a1aa;">출력</div>
                                <div style="color: #ffffff; text-align: right;">${(record.outputTokens || 0).toLocaleString()}</div>
                            </div>
                            <div>
                                <div style="color: #a1a1aa;">비용</div>
                                <div style="color: #ffffff; font-weight: 500; text-align: right;">$${(((record.inputCost || 0) + (record.outputCost || 0))).toFixed(6)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    private attachEventListeners() {
        const globalMeasureBy = this.container.querySelector('#globalMeasureBy') as HTMLSelectElement;
        const globalFilterTimeRange = this.container.querySelector('#globalFilterTimeRange') as HTMLSelectElement;
        const globalFilterModel = this.container.querySelector('#globalFilterModel') as HTMLSelectElement;
        const globalFilterProvider = this.container.querySelector('#globalFilterProvider') as HTMLSelectElement;
        const globalFilterRequestType = this.container.querySelector('#globalFilterRequestType') as HTMLSelectElement;

        const barChartXAxis = this.container.querySelector('#barChartXAxis') as HTMLSelectElement;
        const donutChartGroupBy = this.container.querySelector('#donutChartGroupBy') as HTMLSelectElement;

        const barChartContainer = this.container.querySelector('#barChartContainer');
        const donutChartContainer = this.container.querySelector('#donutChartContainer');
        const statisticsSummary = this.container.querySelector('#statisticsSummary');
        const recentRecordsContainer = this.container.querySelector('#recentRecordsContainer');

        // Initialize filter options
        const records = UsageManager.getRecords([]);
        const uniqueModels = [...new Set(records.map(r => r.model))].sort();
        const uniqueProviderUrls = [...new Set(records.map(r => r.url))].sort();
        const uniqueRequestTypes = [...new Set(records.map(r => r.requestType || RequestType.Unknown))].sort();

        uniqueModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            globalFilterModel.appendChild(option);
        });

        uniqueProviderUrls.forEach(url => {
            const option = document.createElement('option');
            option.value = url;
            option.textContent = ProviderManager.getProvider(url);
            globalFilterProvider.appendChild(option);
        });

        uniqueRequestTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            globalFilterRequestType.appendChild(option);
        });

        const getGlobalFilters = (): UIFilters => {
            let timeRangeMs = 0;
            
            switch (globalFilterTimeRange.value) {
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
                measureBy: globalMeasureBy.value,
                timeRangeMs: timeRangeMs,
                models: globalFilterModel.value ? [globalFilterModel.value] : [],
                providers: globalFilterProvider.value ? [globalFilterProvider.value] : [],
                requestTypes: globalFilterRequestType.value ? [globalFilterRequestType.value] : []
            };
        };


        const scrollBarChartToEnd = () => {
            requestAnimationFrame(() => {
                const container = document.getElementById('bar-chart-scroll-container');
                if (container) {
                    const scrollToEnd = () => {
                        container.scrollLeft = container.scrollWidth - container.clientWidth;
                    };
                    scrollToEnd();
                    setTimeout(scrollToEnd, 50);
                    setTimeout(scrollToEnd, 200);
                }
            });
        };

        const updateStatistics = () => {
            const filters = getGlobalFilters();
            const filteredRecords = UsageManager.getRecords(this.buildUsageFilters(filters));
            const stats = this.calculateStatistics(filteredRecords);
            
            if (statisticsSummary) {
                statisticsSummary.innerHTML = this.renderStatisticsSummary(stats);
            }
        };

        const updateBarChart = () => {
            const filters = getGlobalFilters();
            const xAxis = barChartXAxis.value;
            const records = UsageManager.getRecords(this.buildUsageFilters(filters));
            const chartFilters = {
                models: filters.models,
                providers: filters.providers,
                requestTypes: filters.requestTypes
            };
            
            const data = this.aggregateByTimeRange(records, xAxis, chartFilters);
            if (barChartContainer) {
                barChartContainer.innerHTML = this.renderBarChart(data, filters.measureBy, xAxis);
            }
            scrollBarChartToEnd();
        };

        const updateDonutChart = () => {
            const filters = getGlobalFilters();
            const groupBy = donutChartGroupBy.value;
            const filteredRecords = UsageManager.getRecords(this.buildUsageFilters(filters));
            const chartFilters = {
                models: filters.models,
                providers: filters.providers,
                requestTypes: filters.requestTypes
            };
            
            const data = this.aggregateForDonut(filteredRecords, groupBy, filters.measureBy, chartFilters);
            if (donutChartContainer) {
                donutChartContainer.innerHTML = this.renderDonutChart(data, groupBy, filters.measureBy);
            }
        };

        const updateRecords = () => {
            const filters = getGlobalFilters();
            const filteredRecords = UsageManager.getRecords(this.buildUsageFilters(filters));
            
            if (recentRecordsContainer) {
                recentRecordsContainer.innerHTML = this.renderRecords(filteredRecords);
            }
        };

        const updateAll = () => {
            updateStatistics();
            updateBarChart();
            updateDonutChart();
            updateRecords();
        };

        globalMeasureBy?.addEventListener('change', updateAll);
        globalFilterTimeRange?.addEventListener('change', updateAll);
        globalFilterModel?.addEventListener('change', updateAll);
        globalFilterProvider?.addEventListener('change', updateAll);
        globalFilterRequestType?.addEventListener('change', updateAll);

        barChartXAxis?.addEventListener('change', updateBarChart);
        donutChartGroupBy?.addEventListener('change', updateDonutChart);
        
        updateAll();
    }

    private buildUsageFilters(filters: UIFilters): UsageFilter[] {
        const usageFilters: UsageFilter[] = [];

        if (filters.timeRangeMs > 0) {
            const cutoffTime = new Date().getTime() - filters.timeRangeMs;
            usageFilters.push((record: UsageRecord) => new Date(record.timestamp).getTime() >= cutoffTime);
        }

        if (filters.models.length > 0) {
            usageFilters.push((record: UsageRecord) => filters.models.includes(record.model));
        }

        if (filters.providers.length > 0) {
            usageFilters.push((record: UsageRecord) => filters.providers.includes(record.url));
        }

        if (filters.requestTypes.length > 0) {
            usageFilters.push((record: UsageRecord) => filters.requestTypes.includes(record.requestType || RequestType.Unknown));
        }

        return usageFilters;
    }

    private escapeHTML(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private formatLastUpdated(isoString: string): string {
        try {
            const date = new Date(isoString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}. ${month}. ${day} ${hours}:${minutes}:${seconds}`;
        } catch (e) {
            return '업데이트 정보 없음';
        }
    }
}
