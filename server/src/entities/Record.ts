import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("records")
export class Record {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        name: "user_id",
        type: "int",
        nullable: false
    })
    userId!: number;

    @Column({
        type: "date",
        nullable: false
    })
    date!: Date;

    @Column({
        type: "int",
        nullable: true,
        default: 0
    })
    steps!: number;

    @Column({
        name: "sleep_hours",
        type: "decimal",
        precision: 4,
        scale: 2,
        nullable: true,
        default: 0
    })
    sleepHours!: number;

    @Column({
        name: "food_name",
        type: "varchar",
        length: 100,
        nullable: true
    })
    foodName!: string;

    @Column({
        type: "int",
        nullable: true,
        default: 0
    })
    calories!: number;

    @Column({
        name: "record_type",
        type: "varchar",
        length: 20,
        nullable: false,
        default: "daily"
    })
    recordType!: string;

    @CreateDateColumn({
        name: "created_at"
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at"
    })
    updatedAt!: Date;
}