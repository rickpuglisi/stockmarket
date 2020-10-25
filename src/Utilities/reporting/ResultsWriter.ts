import { MongoRepository } from "typeorm";
import { AI_Scores } from "../../data/entity/Scores";
import { IAI_Scores } from "../../miscellaneous/interfaces";
import { IResultWriter } from "./interfaces";

export class ResultsWriter implements IResultWriter {
    constructor(private readonly scoreRepository: MongoRepository<AI_Scores>) {}

    public async write(uuid: string, symbol: string, score: IAI_Scores): Promise<void> {
        await Promise.all([this.storeResultEntry(uuid, symbol, score)]);
    }

    private async storeResultEntry(
        uuid: string,
        symbol: string,
        score: IAI_Scores,
    ): Promise<void> {
        if (!score) {
            return;
        }

        await Promise.all([this.scoreRepository.insertOne({ jobId: uuid, symbol: symbol, score })]);
    }
}
