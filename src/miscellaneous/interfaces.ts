import { IPortfolioProviderFactoryContext } from "../Utilities/portfolio/interfaces";

export interface IScoringApp<T> {
    main(jobConfig: any): Promise<T>;
}

export interface IScoringResult {
    _id: string;
    results: any;
    runDate: Date;
    scoringAppName: string;
}

export interface IAI_Scores {
    date: Date;
    symbol: string;
    scoreName: string;
    scoreValue: number;
    scoreObject: object;
    comment: string;
}

export interface IScoringConfig {
    appName: string;
}

export interface IDefaultConfig extends IPortfolioProviderFactoryContext {
    namespace: string;
    uuid: string;
    runDate: Date;
}
