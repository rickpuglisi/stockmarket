import { ISourceMap } from "../mapping/interfaces";

export interface IPortfolioProviderFactoryContext {
    holdings?: any[];
    portName: string;
    outputDb?: string;
    usePosCol?: boolean;
    posColName?: string;
    posColQuery?: object;
    simTrades?: any[];
    recalc?: boolean; 
}

export interface IPortfolioProvider {
    sourceMap?: ISourceMap;
    load(): Promise<any[]>;
}

export interface IPortfolioProviderFactory {
    create(
        context: IPortfolioProviderFactoryContext,
        sourceMap?: ISourceMap
    ): IPortfolioProvider;
}
