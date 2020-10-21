import { Logger } from "pino";
import { MongoRepository } from "typeorm";
import { Analytics } from "../../data/entity/Analytics";
import { Security } from "../../data/entity/Securities";
import { IPortfolioProvider } from "./interfaces";

export abstract class PortfolioBasedProvider implements IPortfolioProvider {
    protected constructor(
        private logger: Logger,
        private securityRepository: MongoRepository<Security>,
        private analyticsRepository: MongoRepository<Analytics>,
        private portfolioName: string,
        private dbFilter = false,
        private overrideFields = false
    ) {}

    public async load(): Promise<any[]> {
        const mappedHoldings = [];
        const holdings = await this.getHoldings();
        for (const holding of holdings) {
            const mappedHolding = await this.mapHolding(holding);
            mappedHoldings.push(mappedHolding);
        }
        return mappedHoldings;
    }

    protected abstract getHoldings(): Promise<any[]>;

    private async mapHolding(holding): Promise<{ holding: any; error: string }> {
        const security = await this.securityRepository.findOne({
            _id: holding.securityId,
        });
        if (!security) {
            return {
                holding: undefined,
                error: `Security not found by ID ${holding.securityId}`,
            };
        }
        holding.security = security;

        const analytics = await this.analyticsRepository.findOne({
            _id: holding.securityId,
        });
        if (!analytics) {
            return {
                holding: undefined,
                error: `Analytics not found by ID ${holding.securityId}`,
            };
        }
        holding.analytics = analytics;

        return {
            holding,
            error: undefined,
        };
    }
}