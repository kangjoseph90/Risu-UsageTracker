import { merge } from "lodash";
import { languageEn } from "./en";
import { languageKo } from "./ko";
import { writable, type Writable } from "svelte/store";

export enum LanguageType {
    EN = "en",
    KO = "ko",
}

export const LanguageTypeLabels: Record<LanguageType, string> = {
    [LanguageType.EN]: "English",
    [LanguageType.KO]: "한국어",
};

export type Language = Writable<typeof languageEn>;

export let language: Language = writable(languageEn);


export function setLanguage(lang: LanguageType) {
    switch (lang) {
        case LanguageType.EN:
            language.set(languageEn);
            break;
        default:
            language.set(merge(structuredClone(languageEn), languageKo));
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
