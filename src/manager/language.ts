import { RisuAPI } from '../api'
import { LANGUAGE_ARG } from '../plugin'
import { setLanguage, LanguageType } from '../lang'

/**
 * init,
 * setLanguage,
 * getLanguage
 */
export class LanguageManager {
    static init() {
        const lang = RisuAPI.getArg(LANGUAGE_ARG);
        if (lang && Object.values(LanguageType).includes(lang as LanguageType)) {
            setLanguage(lang as LanguageType);
        } else {
            setLanguage(LanguageType.EN);
            RisuAPI.setArg(LANGUAGE_ARG, LanguageType.EN);
        }
    }

    static setLanguage(lang: LanguageType) {
        setLanguage(lang);
        RisuAPI.setArg(LANGUAGE_ARG, lang);
    }

    static getLanguage(): LanguageType {
        const lang = RisuAPI.getArg(LANGUAGE_ARG);
        if (lang && Object.values(LanguageType).includes(lang as LanguageType)) {
            return lang as LanguageType;
        }
        RisuAPI.setArg(LANGUAGE_ARG, LanguageType.EN);
        return LanguageType.EN;
    }
}