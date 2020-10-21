export interface IPosition {
    securityId: number;
    quantity: number;
    symbol: string;
}

export interface ISourceMap {
    get(
        sourceName: string,
        keys: string[],
        entries: object[],
        refKey: string
    ): object[];
    put(sourceName: string, query: object, update: object): object;
    populate(
        keys: string[],
        entries: object,
        refKey: string,
        level?: number
    ): object;
}

export interface IKnowledge {
    sourceName: string;
    query: object;
    update: object;
}
