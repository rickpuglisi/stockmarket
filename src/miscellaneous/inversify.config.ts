import { PWL_ApproximationArguments } from "../di/module/args";
import { getLogger } from "../logging/logger";

const logger = getLogger("inversify.config");

export function updatePWL_ApproximationArguments(
    config: any,
    args: PWL_ApproximationArguments
) {
    args.setParameter(config.scoreParameter);
    logger.info(`Set ScoreArguments ${JSON.stringify(args, null, 2)}`);
}
