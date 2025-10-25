import { DB_ARG, PRICE_ARG, PRICE_TEMP_ARG, PROVIDER_MAP_ARG } from "../consts";
import { RisuArg, RisuArgType } from "../types";

export const RISU_ARGS: RisuArg = {
    [DB_ARG]: RisuArgType.String,
    [PRICE_ARG]: RisuArgType.String,
    [PRICE_TEMP_ARG]: RisuArgType.String,
    [PROVIDER_MAP_ARG]: RisuArgType.String,
}
