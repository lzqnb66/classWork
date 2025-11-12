import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("sleep_records")
export class SleepRecord {
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
        name: "start_time",
        type: "time",
        nullable: false
    })
    startTime!: string;

    @Column({
        name: "end_time",
        type: "time",
        nullable: false
    })
    endTime!: string;

    @Column({
        type: "decimal",
        precision: 5,
        scale: 2,
        nullable: false
    })
    duration!: number;

    @Column({
        type: "enum",
        enum: ["极好", "良好", "一般", "较差", "很差"],
        nullable: false
    })
    quality!: string;

    @Column({
        name: "deep_sleep_minutes",
        type: "int",
        nullable: true,
        default: 0
    })
    deepSleepMinutes!: number;

    @Column({
        name: "light_sleep_minutes",
        type: "int",
        nullable: true,
        default: 0
    })
    lightSleepMinutes!: number;

    @Column({
        name: "rem_sleep_minutes",
        type: "int",
        nullable: true,
        default: 0
    })
    remSleepMinutes!: number;

    @Column({
        name: "wake_times",
        type: "int",
        nullable: true,
        default: 0
    })
    wakeTimes!: number;

    @Column({
        type: "varchar",
        length: 500,
        nullable: true
    })
    notes!: string;

    @Column({
        type: "varchar",
        length: 50,
        nullable: false,
        default: "手动记录"
    })
    source!: string;

    @CreateDateColumn({
        name: "created_at"
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at"
    })
    updatedAt!: Date;
}