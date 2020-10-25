export interface IPWL_ApproximationArguments {
    getParameter(): number;
}

export interface IUpdatePWL_ApproximationArguments {
    setParameter(param: number);
}

export interface IPriceHistory {
    Open: { [key: string]: number};
    High: { [key: string]: number};
    Low: { [key: string]: number};
    Close: { [key: string]: number};
    Volume: { [key: string]: number};
}

export interface IPWL_ApproximationResult {
    indices: number[];
    slopes: number[];
    intercepts: number[];
    xpoints: number[];
}

export interface IPWL_ApproximationDocument {
    date: Date;
    symbol: string;
    segmentNumber: number;
    startingIndex: number;
    endingIndex: number;
    startingXPoint: number;
    endingXPoint: number;
    startingVertex: number;
    endingVertex: number;
    slope: number;
    intercept: number;
    channelLength: number;
}

export interface IPWL_Series {
    x: number[];
    y: number[];
    yHat: number[];
}

export interface IPWL_Algorithm {
    findFixedNumSegments(): IPWL_ApproximationDocument[];
    findFixedRejectDiscontinousSegments(): IPWL_ApproximationDocument[];
    findQPSegments(): IPWL_ApproximationDocument[];
}
