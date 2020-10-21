import { Connection, MongoRepository } from "typeorm";
import { Analytics } from "../data/entity/Analytics";
import { AI_Scores } from "../data/entity/Scores";
import { Security } from "../data/entity/Securities";
import { PWL_ApproximationAppFactory } from "../di/module/appFactories";
import { PWL_ApproximationArguments } from "../di/module/args";
import { AppNames } from "../miscellaneous/constants";
import { getConfigForPWL_Approximation } from "./config";
import { safeRun } from "./lib";

export function PWL_Approximation(
    args,
    scoreArgs: PWL_ApproximationArguments,
    connection: Connection,
    scoresRepository: MongoRepository<AI_Scores>,
    securityRepository: MongoRepository<Security>,
    analyticsRepository: MongoRepository<Analytics>
) {
    const appName = AppNames.PWL_Approx;
    const action = async () => {
        const body = args.body;
        if (body['ticker']) {
            const config = await getConfigForPWL_Approximation(body);
            config.appName = appName;

            const app = PWL_ApproximationAppFactory(
                config,
                scoreArgs,
                connection,
                scoresRepository,
                securityRepository,
                analyticsRepository
            );
            return app.main();
        } else {
            throw new Error(
                "The parameter list is not valid. Please refer to user documentation"
            );
        }
    }    
    return safeRun(action, appName);
}
