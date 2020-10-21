import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity("positions")
export class Position {
    @ObjectIdColumn()
    _id: ObjectID;

    @Column()
    securityId: number | string;
}
