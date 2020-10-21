import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity("securities")
export class Security {
    @ObjectIdColumn()
    _id: ObjectID;

    @Column()
    securityId: number | string;

    @Column()
    currency: string;

    @Column()
    exchange: string;

    @Column()
    symbol: string;

    @Column()
    type: string;

    @Column()
    description: string;
}
