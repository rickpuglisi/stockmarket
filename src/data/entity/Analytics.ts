import { Column, Entity, ObjectIdColumn } from "typeorm";

@Entity("analytics")
export class Analytics {
    @ObjectIdColumn()
    _id: number;

    @Column()
    historicalVol: number;
}
