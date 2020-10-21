import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity("portfolios")
export class Position {
    @ObjectIdColumn()
    _id: ObjectID;
}
