import { getLogger } from "../logging/logger";
import { ScoreStrings } from "../miscellaneous/constants";
import { IDefaultConfig } from "../miscellaneous/interfaces";
import { guid } from "../Utilities/general_lib";

const logger = getLogger("REST/config");

function setRunDateAndUuid(config: any, body: any) {
    config.runDate = body.runDate !== undefined ? body.runDate : new Date();
    config.uuid = body.uuid !== undefined ? body.uuid : guid();
}

function setHoldingsOrPositionCollection(config: any, body: any) {
    if (body.holdings) {
        config.holdings = body.holdings;
    } else if (body.portName || (body.usePosCol && body.positionColName)) {
        config.usePosCol = body.usePosCol !== undefined ? body.usePosCol : false;
        config.posColName = body.posColName !== undefined ? body.posColName : null;
        config.posColQuery = body.posColQuery !== undefined && config.usePosCol
            ? body.posColQuery
            : {};
    }
}

export function getDefaultConfig(): IDefaultConfig {
    return {
        portName: null,
        outputDb: ScoreStrings.scoring,
        recalc: false,
        namespace: '',
        // the following fields will be set later on
        uuid: undefined,
        runDate: undefined,
    };
}

export function getPortfConfig(body) {
    const config: any = getDefaultConfig();
    Object.assign(config, {
        recalc: false,
        usePosCol: false,
        posColName: null,
        posColQuery: {
            uuid: '',
        }
    });
    setHoldingsOrPositionCollection(config, body);
    return config
}

export async function getJobConfigForPWL_Approximation(ticker: string, interval: string) {
    const config: any = {
        ticker,
        interval
    };
    // setRunDateAndUuid(config, body);
    return config;
}
