import { MongoRepository } from "typeorm";
import { AI_Scores } from "../../data/entity/Scores";
import { IAI_Scores } from "../../miscellaneous/interfaces";
import { IResultWriter } from "./interfaces";

export class ResultsWriter implements IResultWriter {
    constructor(private readonly scoreRepository: MongoRepository<AI_Scores>) {}

    public async write(uuid: string, score: IAI_Scores): Promise<void> {
        await Promise.all([this.storeResultEntry(score, uuid)]);
    }

    private async storeResultEntry(
        score: IAI_Scores,
        uuid: string
    ): Promise<void> {
        if (!score) {
            return;
        }

        await Promise.all([this.scoreRepository.insertOne({ jobId: uuid, score })]);
    }
}
