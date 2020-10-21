import { getuid } from "process";
import { IScoringApp, IScoringResult } from "../miscellaneous/interfaces";
import { guid } from "./general_lib";

export abstract class ScoringApp<T> implements IScoringApp<T> {
    public name = "App is not set";
    public abort = false;
    public uuid: string;

    constructor(protected config) {
        this.name = config.appName;
        this.uuid = guid();
    }

    public abstract main(): Promise<T>;

    protected makeResultObject(): IScoringResult {
        return {
            reportIdentifiers: [
                {
                    _id: this.config.uuid ? this.config.uuid : getuid(),
                    results: {
                        node: this.uuid,
                    },
                    runDate: this.config.runDate,
                    scoringAppName: this.name,
                }
            ]
        };
    }
}