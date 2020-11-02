import { Connection, MongoRepository } from "typeorm";
import { Analytics } from "../../data/entity/Analytics";
import { AI_Scores } from "../../data/entity/Scores";
import { Security } from "../../data/entity/Securities";
import { updatePWL_ApproximationArguments } from "../../miscellaneous/inversify.config";
import { PWL_ApproximationApp } from "../../pwl_approximation/pwl_approx_main_lib";
import { IPortfolioProviderFactoryContext } from "../../Utilities/portfolio/interfaces";
import { PortfolioProviderFactory } from "../../Utilities/portfolio/PortfolioProviderFactory";
import { ResultsWriter } from "../../Utilities/reporting/ResultsWriter";
import { PWL_ApproximationArguments } from "./args";

export function PWL_ApproximationAppFactory(
    portfConfig: IPortfolioProviderFactoryContext,
    args: PWL_ApproximationArguments,
    connection: Connection,
    scoresRepository: MongoRepository<AI_Scores>,
    securityRepository: MongoRepository<Security>,
    analyticsRepository: MongoRepository<Analytics>
) {
    updatePWL_ApproximationArguments(portfConfig, args);

    const resultsWriter = new ResultsWriter(scoresRepository);

    const portfolioProviderFactory = new PortfolioProviderFactory(
        connection,
        securityRepository,
        analyticsRepository
    );
    const portfolioProvider = portfolioProviderFactory.create(portfConfig);
    return new PWL_ApproximationApp(resultsWriter, portfolioProvider);
}
