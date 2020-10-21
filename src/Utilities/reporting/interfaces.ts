import { IAI_Scores } from "../../miscellaneous/interfaces";

export interface IResultWriter {
    write(uuid: string, score: IAI_Scores): Promise<void>;
}
