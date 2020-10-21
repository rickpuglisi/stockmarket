import { IPortfolioProviderFactoryContext } from "../Utilities/portfolio/interfaces";

export interface IScoringApp<T> {
    main(): Promise<T>;
}

export interface IReportIdentifier {
    _id: string;
    results: {
        node: string;
    };
    runDate: Date;
    scoringAppName: string;
}

export interface IScoringResult {
    reportIdentifiers: IReportIdentifier[];
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
