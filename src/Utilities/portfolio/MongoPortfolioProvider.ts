import { Connection, MongoRepository } from "typeorm";
import { Analytics } from "../../data/entity/Analytics";
import { Security } from "../../data/entity/Securities";
import { getLogger } from "../../logging/logger";
import { IPosition, ISourceMap } from "../mapping/interfaces";
import { PortfolioBasedProvider } from "./PortfolioBasedProvider";

export class MongoPortfolioProvider extends PortfolioBasedProvider {
    constructor(
        private readonly connection: Connection,
        securityRepository: MongoRepository<Security>,
        analyticsRepository: MongoRepository<Analytics>,
        portfolioName: string,
        private connectionAlias: string,
        private collectionName: string,
        private query: object,
        public sourceMap?: ISourceMap
    ) {
        super(
            getLogger('MongoPortfolioProvider'),
            securityRepository,
            analyticsRepository,
            portfolioName
        );
    }

    protected async getHoldings(): Promise<any[]> {
        const holdings: IPosition[] = [];

        if (this.query['uuid']) {
            const documents = await this.connection
            .getMongoRepository(this.collectionName)
            .aggregate<IPosition>([
                { $match: this.query },
                { $unwind: "$holdings" },
                { $project: { _id: 0, portfolioName: 1, holdings: 1 } },
            ])
            .toArray();
        } else {
            holdings.push(
                ...(await this.connection
                    .getMongoRepository<IPosition>(this.collectionName)
                    .find(this.query))
            );
        }

        return holdings;
    }
}
