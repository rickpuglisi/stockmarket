import { getLogger } from "../logging/logger";
import { IAI_Scores, IScoringResult } from "../miscellaneous/interfaces";
import { IPortfolioProvider } from "../Utilities/portfolio/interfaces";
import { IResultWriter } from "../Utilities/reporting/interfaces";
import { ScoringApp } from "../Utilities/scoring_app_lib";
import { PWL_Algorithm } from "./algorithms";
import { sampleX, sampleY, YFINANCE_URL } from "./constants";
import { IPriceHistory, IPWL_ApproximationDocument } from "./interfaces";
import fetch = require("node-fetch");
import { AppNames } from "../miscellaneous/constants";

const logger = getLogger("pwl_approximation_main");

export class PWL_ApproximationApp extends ScoringApp<IScoringResult> {
    public config: any;

    constructor(
        private resultsWriter: IResultWriter,
        private portfolioProvider: IPortfolioProvider,
    ) {
        super(AppNames.PWL_Approx);
    }

    /**
     * The main entry point after the constructor
     * @returns {IScoringResult} - scoring result
     */
    public async main(jobConfig: any): Promise<IScoringResult> {
        this.config = jobConfig;
        let result;
        logger.info(`PWL_Approximation input config: ${JSON.stringify(this.config)}`);

        let url = YFINANCE_URL + this.config.ticker;
        if (this.config.interval) {
            url += (`?interval=${this.config.interval}`);
        }

        const response = await fetch(url)
            .then(res => res.json())
            .then(json => {
                result = this.findSegments(5, json);
            });
        return result;
    }

    public async reportResult(symbol: string, comment: string, result: IPWL_ApproximationDocument[]) {
        const pwlResult = {
            date: new Date(),
            symbol: symbol,
            scoreName: "pwl_approx",
            scoreValue: 0,
            scoreObject: result,
            comment,
        } as IAI_Scores;

        logger.info(`PWL_Approximation Result = ${JSON.stringify(pwlResult)}`);

        await this.resultsWriter.write(this.config.uuid, symbol, pwlResult);
    }

    private findSampleSegments() {
        let i = 0;
        const keys = sampleX.map(key => String(i++));
        const algorithm = new PWL_Algorithm('sample', 3, sampleX.length, keys, sampleX, sampleY);

        // use discontinous regression lines
        const test1Result = algorithm.findFixedNumSegments(false);
        this.reportResult("sample", "regression", test1Result);
        // use breakpoints
        const test2Result = algorithm.findFixedNumSegments();
        this.reportResult("sample", "breakpoints", test2Result);
        // use xpoints
        const test3Result = algorithm.findFixedRejectDiscontinousSegments();
        this.reportResult("sample", "xpoints", test3Result);
        const series = algorithm.getSeries(test3Result);
        return this.makeResultObject(series);
    }

    private findSegments(numSegments: number, json: IPriceHistory) {
        // json contains open, high, low, close, volume
        // data must be sorted
        const keyArray = Object.keys((json).Close);

        let i = 0;
        const xArray = keyArray.map(key => i++);
        const yArray = keyArray.map(key => json.Close[key]);
        logger.debug('keyArray = ' + JSON.stringify(keyArray));
        logger.debug('xArray count = ' + xArray.length + ' data = ' + JSON.stringify(xArray));
        logger.debug('yArray count = ' + yArray.length + ' data = ' + JSON.stringify(yArray));
        
        // calculate
        const algorithm = new PWL_Algorithm(this.config.ticker, numSegments, xArray.length, keyArray, xArray, yArray);        
        // use xpoints
        // const segmentResults = algorithm.findFixedNumSegments(true);
        const segmentResults = algorithm.findFixedRejectDiscontinousSegments();
        // write to mongo
        this.reportResult(this.config.ticker, "xpoints", segmentResults);
        // prepare return
        const series = algorithm.getSeries(segmentResults);
        return this.makeResultObject(series);        
    }

}
