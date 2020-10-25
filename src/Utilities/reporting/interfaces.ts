import { IAI_Scores } from "../../miscellaneous/interfaces";

export interface IResultWriter {
    write(uuid: string, symbol: string, score: IAI_Scores): Promise<void>;
}
