import { Logger } from '../logger';
import { CacheManager } from './cache';
import { LanguageType } from '../lang';

export enum Currency {
    USD = 'usd',
    EUR = 'eur',
    KRW = 'krw',
    JPY = 'jpy',
    GBP = 'gbp',
    CNY = 'cny',
}

interface ExchangeRateData {
    [key: string]: number;
}

interface CurrencyApiResponse {
    [currency: string]: ExchangeRateData;
}

const LanguageCurrencyMap: Record<LanguageType, Currency> = {
    [LanguageType.EN]: Currency.USD,
    [LanguageType.KO]: Currency.KRW,
};

const CurrencySymbols: Record<Currency, string> = {
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.KRW]: '₩',
    [Currency.JPY]: '¥',
    [Currency.GBP]: '£',
    [Currency.CNY]: '¥',
};

const CurrencyDecimals: Record<Currency, number> = {
    [Currency.USD]: 4,
    [Currency.EUR]: 4,
    [Currency.KRW]: 0,
    [Currency.JPY]: 2,
    [Currency.GBP]: 4,
    [Currency.CNY]: 4,
};

/**
 * Currency exchange rate manager
 * 
 * Features:
 * - Fetch exchange rates from fawazahmed0/currency-api
 * - Cache management with 24-hour TTL
 * - Language-based currency conversion
 * - Error handling and fallback to USD
 */
export class CurrencyManager {
    private static readonly API_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1';
    private static readonly CACHE_TTL_HOURS = 24;
    private static readonly REQUEST_TIMEOUT_MS = 5000;

    /**
     * Get exchange rate between two currencies
     * @param fromCurrency Source currency code (e.g., 'usd')
     * @param toCurrency Target currency code (e.g., 'krw')
     * @returns Exchange rate or 1 if error/unavailable
     */
    static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
        try {
            // Same currency, no conversion needed
            if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
                return 1;
            }

            const cacheKey = this.buildCacheKey(fromCurrency, toCurrency);

            // Check cache first
            const cachedRate = CacheManager.get<number>(cacheKey);
            if (cachedRate !== null) {
                return cachedRate;
            }

            // Fetch from API
            const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);

            // Cache the result
            CacheManager.set(cacheKey, rate, this.CACHE_TTL_HOURS);

            return rate;
        } catch (e) {
            Logger.warn(`Failed to get exchange rate for ${fromCurrency}/${toCurrency}:`, e);
            return 1; // Fallback to 1:1 ratio
        }
    }

    /**
     * Convert amount from one currency to another
     * @param amount Amount to convert
     * @param fromCurrency Source currency code
     * @param toCurrency Target currency code
     * @returns Converted amount or original amount if error
     */
    static async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
        try {
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            return amount * rate;
        } catch (e) {
            Logger.warn(`Failed to convert amount from ${fromCurrency} to ${toCurrency}:`, e);
            return amount;
        }
    }

    /**
     * Convert USD to language-specific currency
     * @param amount USD amount
     * @param language Target language
     * @returns Converted amount
     */
    static async convertFromUSD(amount: number, language: LanguageType): Promise<number> {
        try {
            const targetCurrency = LanguageCurrencyMap[language];
            if (!targetCurrency) {
                Logger.warn(`No currency mapping for language: ${language}`);
                return amount;
            }

            return await this.convertAmount(amount, Currency.USD, targetCurrency);
        } catch (e) {
            Logger.warn(`Failed to convert USD to language currency:`, e);
            return amount;
        }
    }

    /**
     * Get currency code for specific language
     * @param language Language type
     * @returns Currency code (e.g., 'krw', 'usd')
     */
    static getCurrencyForLanguage(language: LanguageType): Currency {
        return LanguageCurrencyMap[language] ?? Currency.USD;
    }

    /**
     * Get currency symbol
     * @param currency Currency code
     * @returns Symbol (e.g., '$', '₩')
     */
    static getSymbol(currency: Currency): string {
        return CurrencySymbols[currency] ?? '$';
    }

    /**
     * Get decimal places for currency
     * @param currency Currency code
     * @returns Number of decimal places
     */
    static getDecimals(currency: Currency): number {
        return CurrencyDecimals[currency] ?? 4;
    }

    /**
     * Format amount with currency symbol and proper decimals
     * @param amount Amount to format
     * @param currency Currency code
     * @returns Formatted string (e.g., '₩1,300', '$0.0001')
     */
    static formatAmount(amount: number, currency: Currency): string {
        try {
            const decimals = this.getDecimals(currency);
            const symbol = this.getSymbol(currency);

            // Round to appropriate decimal places first
            const roundedAmount = decimals === 0
                ? Math.round(amount)
                : Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);

            // Format with proper decimal places
            const formattedValue = roundedAmount.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            return `${symbol}${formattedValue}`;
        } catch (e) {
            Logger.warn(`Failed to format amount:`, e);
            return `$${amount.toFixed(4)}`;
        }
    }


    /**
     * Fetch exchange rate from API
     * @param fromCurrency Source currency code
     * @param toCurrency Target currency code
     * @returns Exchange rate
     */
    private static async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
        try {
            const url = `${this.API_BASE}/currencies/${fromCurrency.toLowerCase()}.json`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

            const response = await fetch(url, {
                signal: controller.signal,
                mode: 'cors'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }

            const data: CurrencyApiResponse = await response.json();
            const currencyData = data[fromCurrency.toLowerCase()];

            if (!currencyData || !currencyData[toCurrency.toLowerCase()]) {
                throw new Error(`Exchange rate not found for ${fromCurrency}/${toCurrency}`);
            }

            const rate = currencyData[toCurrency.toLowerCase()];
            Logger.log(`Fetched exchange rate from API: ${fromCurrency}/${toCurrency} = ${rate}`);

            return rate;
        } catch (e) {
            throw new Error(`Failed to fetch exchange rate: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    /**
     * Build cache key for exchange rate
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @returns Cache key
     */
    private static buildCacheKey(fromCurrency: string, toCurrency: string): string {
        return `currency-${fromCurrency.toLowerCase()}-${toCurrency.toLowerCase()}`;
    }
}