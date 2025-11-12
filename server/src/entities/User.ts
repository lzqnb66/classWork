import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "varchar",
        length: 50,
        unique: true,
        nullable: false
    })
    username!: string;

    @Column({
        type: "varchar",
        length: 255,
        nullable: false,
        name: "password_hash"
    })
    password!: string;

    @Column({
        type: "boolean",
        default: false,
        name: "is_admin"
    })
    isAdmin!: boolean;

    @CreateDateColumn({
        name: "created_at"
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at"
    })
    updatedAt!: Date;
}