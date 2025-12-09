import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users') // table name in your DB
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  email: string;
}
