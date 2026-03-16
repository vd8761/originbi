import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Notification, User as AdminUser } from '@originbi/shared-entities';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,

        @InjectRepository(AdminUser)
        private readonly userRepo: Repository<AdminUser>,
    ) { }

    async createNotification(data: {
        userId?: number;
        role: string;
        type: string;
        title: string;
        message: string;
        metadata?: any;
    }) {
        try {
            if (!data.userId) {
                // Find all users with this role to broadcast
                const users = await this.userRepo.find({
                    where: { role: data.role, isActive: true },
                    select: ['id'],
                });

                if (users.length === 0) {
                    this.logger.warn(`No active users found with role ${data.role} to notify.`);
                    return null;
                }

                const notifications = users.map(user =>
                    this.notificationRepo.create({
                        ...data,
                        userId: Number(user.id),
                    })
                );

                return await this.notificationRepo.save(notifications);
            }

            const notification = this.notificationRepo.create({
                ...data,
                userId: data.userId,
            });
            return await this.notificationRepo.save(notification);
        } catch (error) {
            this.logger.error(`Error creating notification: ${error.message}`);
            throw error;
        }
    }

    async getUnreadCount(userId: number, role: string): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return this.notificationRepo.count({
            where: {
                userId,
                role,
                isRead: false,
                createdAt: MoreThan(thirtyDaysAgo),
            },
        });
    }

    async getNotifications(userId: number, role: string, page = 1, limit = 20) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [items, total] = await this.notificationRepo.findAndCount({
            where: {
                userId,
                role,
                createdAt: MoreThan(thirtyDaysAgo),
            },
            order: {
                createdAt: 'DESC',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items,
            total,
            page,
            limit,
        };
    }

    async markAsRead(id: number, userId: number) {
        return this.notificationRepo.update(
            { id, userId },
            { isRead: true },
        );
    }

    async markAllAsRead(userId: number, role: string) {
        return this.notificationRepo.update(
            { userId, role, isRead: false },
            { isRead: true },
        );
    }
}
