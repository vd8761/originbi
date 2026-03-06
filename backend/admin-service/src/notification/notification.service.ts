import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@originbi/shared-entities';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
    ) { }

    async createNotification(data: {
        userId: number;
        role: string;
        type: string;
        title: string;
        message: string;
        metadata?: any;
    }) {
        try {
            const notification = this.notificationRepo.create({
                ...data,
            });
            return await this.notificationRepo.save(notification);
        } catch (error) {
            this.logger.error(`Error creating notification: ${error.message}`);
            throw error;
        }
    }

    async getUnreadCount(userId: number, role: string): Promise<number> {
        return this.notificationRepo.count({
            where: {
                userId,
                role,
                isRead: false,
            },
        });
    }

    async getNotifications(userId: number, role: string, page = 1, limit = 20) {
        const [items, total] = await this.notificationRepo.findAndCount({
            where: {
                userId,
                role,
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

    async markAsRead(id: string, userId: number) {
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
