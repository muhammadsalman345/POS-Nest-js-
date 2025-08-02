import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shopName: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true, type: 'decimal' })
  latitude?: number;

  @Column({ nullable: true, type: 'decimal' })
  longitude?: number;

  @Column({ nullable: true })
  phone?: string;

  // ✅ Explicit userId column for FK
  @Column()
  userId: number;

  // ✅ Relation to User
  @ManyToOne(() => User, (user) => user.shops, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'userId' }) // FK column is userId
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
