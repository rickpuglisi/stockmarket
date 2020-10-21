import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity("ai_scores")
export class AI_Scores {
    @ObjectIdColumn()
    _id: ObjectID;

    @Column()
    date: Date;

    @Column()
    symbol: string;

    @Column()
    scoreName: string;

    @Column()
    scoreValue: number;

    @Column()
    scoreObject: object;

    @Column()
    comment: string;
}
