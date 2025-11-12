import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("diet_records")
export class DietRecord {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        name: "user_id",
        type: "int",
        nullable: false
    })
    userId!: number;

    @Column({
        type: "varchar",
        length: 100,
        nullable: false
    })
    foodName!: string;

    @Column({
        type: "int",
        nullable: false
    })
    calories!: number;

    @Column({
        type: "decimal",
        precision: 5,
        scale: 2,
        nullable: true,
        default: 0
    })
    protein!: number;

    @Column({
        type: "decimal",
        precision: 5,
        scale: 2,
        nullable: true,
        default: 0
    })
    carbs!: number;

    @Column({
        type: "decimal",
        precision: 5,
        scale: 2,
        nullable: true,
        default: 0
    })
    fat!: number;

    @Column({
        name: "meal_type",
        type: "varchar",
        length: 20,
        nullable: false,
        default: "other"
    })
    mealType!: string;

    @Column({
        type: "decimal",
        precision: 6,
        scale: 2,
        nullable: false,
        default: 1
    })
    quantity!: number;

    @Column({
        type: "varchar",
        length: 20,
        nullable: false,
        default: "份"
    })
    unit!: string;

    @Column({
        type: "date",
        nullable: false
    })
    date!: Date;

    @Column({
        type: "time",
        nullable: true
    })
    time!: string;

    @CreateDateColumn({
        name: "created_at"
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at"
    })
    updatedAt!: Date;
}