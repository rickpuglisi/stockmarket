import { Connection, MongoRepository } from "typeorm";
import { Analytics } from "../data/entity/Analytics";
import { AI_Scores } from "../data/entity/Scores";
import { Security } from "../data/entity/Securities";
import { PWL_ApproximationAppFactory } from "../di/module/appFactories";
import { PWL_ApproximationArguments } from "../di/module/args";
import { AppNames } from "../miscellaneous/constants";
import { IScoringResult } from "../miscellaneous/interfaces";
import { sleep } from "../Utilities/general_lib";
import { IPortfolioProviderFactoryContext } from "../Utilities/portfolio/interfaces";
import { getJobConfigForPWL_Approximation, getPortfConfig } from "./config";
import { safeRun } from "./lib";

export function PWL_Approximation(
    args,
    scoreArgs: PWL_ApproximationArguments,
    connection: Connection,
    scoresRepository: MongoRepository<AI_Scores>,
    securityRepository: MongoRepository<Security>,
    analyticsRepository: MongoRepository<Analytics>
) {
    const action = async () => {
        const body = args.body;
        if (body.ticker) {
            const portfConfig: IPortfolioProviderFactoryContext = await getPortfConfig(body);
            const app = PWL_ApproximationAppFactory(
                portfConfig,
                scoreArgs,
                connection,
                scoresRepository,
                securityRepository,
                analyticsRepository
            );

            const config = await getJobConfigForPWL_Approximation(body.ticker, body.interval);
            return app.main(config);
        } else {
            throw new Error(
                "The parameter list is not valid. Please refer to user documentation"
            );
        }
    }    
    return safeRun(action, AppNames.PWL_Approx);
}

export function PWL_ApproximateList(
    args,
    scoreArgs: PWL_ApproximationArguments,
    connection: Connection,
    scoresRepository: MongoRepository<AI_Scores>,
    securityRepository: MongoRepository<Security>,
    analyticsRepository: MongoRepository<Analytics>
) {
    const action = async () => {
        let result: Promise<IScoringResult>;
        const body = args.body;
        if (body.tickers) {
            const portfConfig: IPortfolioProviderFactoryContext = await getPortfConfig(body);
            const app = PWL_ApproximationAppFactory(
                portfConfig,
                scoreArgs,
                connection,
                scoresRepository,
                securityRepository,
                analyticsRepository
            );

            for (const ticker in body.tickers) {
                await sleep(5000);
                const config = await getJobConfigForPWL_Approximation(ticker, body.interval);
                result = app.main(config);
            }
            return result
        } else {
            throw new Error(
                "The parameter list is not valid. Please refer to user documentation"
            );
        }
    }    
    return safeRun(action, AppNames.PWL_Approx);
}
