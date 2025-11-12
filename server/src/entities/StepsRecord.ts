import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("steps_records")
export class StepsRecord {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        name: "user_id",
        type: "int",
        nullable: false
    })
    userId!: number;

    @Column({
        type: "int",
        nullable: false
    })
    steps!: number;

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

    @Column({
        name: "source",
        type: "varchar",
        length: 50,
        nullable: false,
        default: "手动记录"
    })
    source!: string;

    @Column({
        name: "notes",
        type: "varchar",
        length: 200,
        nullable: true
    })
    notes!: string;

    @Column({
        name: "calories_burned",
        type: "decimal",
        precision: 8,
        scale: 2,
        nullable: true,
        default: 0
    })
    caloriesBurned!: number;

    @Column({
        name: "distance_km",
        type: "decimal",
        precision: 6,
        scale: 2,
        nullable: true,
        default: 0
    })
    distanceKm!: number;

    @CreateDateColumn({
        name: "created_at"
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at"
    })
    updatedAt!: Date;
}