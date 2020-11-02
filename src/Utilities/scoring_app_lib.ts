import { Logger } from "mongodb";
import { getLogger } from "../logging/logger";
import { IScoringApp, IScoringResult } from "../miscellaneous/interfaces";
import { guid } from "./general_lib";

const logger = getLogger("pwl_algorithm");

export abstract class ScoringApp<T> implements IScoringApp<T> {
    constructor(public name: string) {
    }

    public abstract main(config: any): Promise<T>;

    protected makeResultObject(results: any): IScoringResult {
        return {
            _id: guid(),
            results: results,
            runDate: new Date(),
            scoringAppName: this.name,
        }
    }
}