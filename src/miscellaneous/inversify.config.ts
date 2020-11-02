import { PWL_ApproximationArguments } from "../di/module/args";
import { getLogger } from "../logging/logger";

const logger = getLogger("inversify.config");

export function updatePWL_ApproximationArguments(
    portfConfig: any,
    args: PWL_ApproximationArguments
) {
    args.setParameter(portfConfig.myParameter);
    logger.info(`Set ScoreArguments ${JSON.stringify(args, null, 2)}`);
}
