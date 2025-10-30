import { RisuAPI } from '../api'
import { LANGUAGE_ARG } from '../plugin'
import { setLanguage, SupportedLanguage } from '../lang'

/**
 * init,
 * setLanguage,
 * getLanguage
 */
export class LanguageManager {
    static init() {
        const lang = RisuAPI.getArg(LANGUAGE_ARG);
        if (lang && Object.values(SupportedLanguage).includes(lang as SupportedLanguage)) {
            setLanguage(lang as SupportedLanguage);
        } else {
            setLanguage(SupportedLanguage.EN);
            RisuAPI.setArg(LANGUAGE_ARG, SupportedLanguage.EN);
        }
    }

    static setLanguage(lang: SupportedLanguage) {
        setLanguage(lang);
        RisuAPI.setArg(LANGUAGE_ARG, lang);
    }

    static getLanguage(): SupportedLanguage {
        const lang = RisuAPI.getArg(LANGUAGE_ARG);
        if (lang && Object.values(SupportedLanguage).includes(lang as SupportedLanguage)) {
            return lang as SupportedLanguage;
        }
        RisuAPI.setArg(LANGUAGE_ARG, SupportedLanguage.EN);
        return SupportedLanguage.EN;
    }
}