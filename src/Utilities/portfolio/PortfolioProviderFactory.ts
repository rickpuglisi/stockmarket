import { Connection, MongoRepository } from "typeorm";
import { Analytics } from "../../data/entity/Analytics";
import { Security } from "../../data/entity/Securities";
import { getLogger } from "../../logging/logger";
import { ISourceMap } from "../mapping/interfaces";
import { IPortfolioProvider, IPortfolioProviderFactory, IPortfolioProviderFactoryContext } from "./interfaces";
import { MongoPortfolioProvider } from "./MongoPortfolioProvider";

const logger = getLogger('PortfolioProviderFactory');

export class PortfolioProviderFactory implements IPortfolioProviderFactory {
    constructor(
        private readonly connection: Connection,
        private readonly securityRepository: MongoRepository<Security>,
        private readonly analyticsRepository: MongoRepository<Analytics>
    ) {}

    public create(
        context: IPortfolioProviderFactoryContext,
        sourceMap?: ISourceMap
    ): IPortfolioProvider {
        let  provider: IPortfolioProvider;
        if (context.usePosCol && context.posColName) {
            const match = context.posColQuery || {};
            provider = new MongoPortfolioProvider(
                this.connection,
                this.securityRepository,
                this.analyticsRepository,
                context.portName,
                context.outputDb,
                context.posColName,
                match,
                sourceMap
            );
        }
        return provider;
    }
}
