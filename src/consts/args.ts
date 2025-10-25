import { DB_ARG, PRICE_ARG, PRICE_TEMP_ARG, PROVIDER_MAP_ARG } from "../consts";
import { RisuArg, RisuArgType } from "../types";

export const RISU_ARGS: RisuArg = {
    [DB_ARG]: RisuArgType.String,
    [PRICE_ARG]: RisuArgType.String,
    [PRICE_TEMP_ARG]: RisuArgType.String,
    [PROVIDER_MAP_ARG]: RisuArgType.String,
}

/**
 * 등록된 모든 Risu Arg 이름을 배열로 반환
 */
export function getAllArgNames(): string[] {
    return Object.keys(RISU_ARGS);
}