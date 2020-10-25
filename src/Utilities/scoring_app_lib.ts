import { Logger } from "mongodb";
import { getuid } from "process";
import { getLogger } from "../logging/logger";
import { IScoringApp, IScoringResult } from "../miscellaneous/interfaces";
import { guid } from "./general_lib";

const logger = getLogger("pwl_algorithm");

export abstract class ScoringApp<T> implements IScoringApp<T> {
    public name = "App is not set";
    public abort = false;
    public uuid: string;

    constructor(protected config) {
        this.name = config.appName;
        this.uuid = guid();
    }

    public abstract main(): Promise<T>;

    protected makeResultObject(results: any): IScoringResult {
        return {
            _id: this.config.uuid ? this.config.uuid : getuid(),
            results: results,
            runDate: this.config.runDate,
            scoringAppName: this.name,
        }
    }
}