import { merge } from "lodash";
import { languageEn } from "./en";
import { languageKo } from "./ko";

export enum SupportedLanguage {
    EN = "en",
    KO = "ko",
}

export const SupportedLanguageLabels: Record<SupportedLanguage, string> = {
    [SupportedLanguage.EN]: "English",
    [SupportedLanguage.KO]: "한국어",
};

export type LanguageType = typeof languageEn;

export let language: LanguageType = languageEn;


export function setLanguage(lang: SupportedLanguage) {
    switch (lang) {
        case SupportedLanguage.EN:
            language = languageEn;
            break;
        default:
            language = merge(structuredClone(languageEn), languageKo);
            break;
    }
}

/**
 * Template string replacement utility
 * - Example: formatString("Hello {{name}}, you have {{count}} messages", { name: "John", count: 5 })
 */
export function formatString(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        return params[key]?.toString() || match;
    });
}
