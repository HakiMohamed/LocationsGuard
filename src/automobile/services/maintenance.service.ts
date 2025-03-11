import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maintenance, MaintenanceDocument, MaintenanceStatus } from '../schemas/maintenance.schema';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from '../dto/maintenance.dto';
import { AutomobileService } from './automobile.service';
import { MailService } from '../../mail/mail.service';
import { SmsService } from '../../sms/sms.service';
import { User } from '../../auth/schemas/user.schema';

@Injectable()
export class MaintenanceService {
    constructor(
        @InjectModel(Maintenance.name) private maintenanceModel: Model<MaintenanceDocument>,
        private automobileService: AutomobileService,
        private mailService: MailService,
        private smsService: SmsService
    ) {
        // Vérifier les maintenances à venir quotidiennement
        setInterval(() => this.checkUpcomingMaintenance(), 24 * 60 * 60 * 1000);
    }

    async create(createMaintenanceDto: CreateMaintenanceDto): Promise<MaintenanceDocument> {
        const automobile = await this.automobileService.findOne(createMaintenanceDto.automobileId);
        
        const maintenance = new this.maintenanceModel({
            ...createMaintenanceDto,
            automobile: createMaintenanceDto.automobileId,
            notificationSent: false
        });

        return maintenance.save();
    }

    async findAll(): Promise<MaintenanceDocument[]> {
        return this.maintenanceModel
            .find()
            .populate('automobile')
            .exec();
    }

    async findOne(id: string): Promise<MaintenanceDocument> {
        const maintenance = await this.maintenanceModel
            .findById(id)
            .populate('automobile')
            .exec();

        if (!maintenance) {
            throw new NotFoundException(`Maintenance #${id} not found`);
        }

        return maintenance;
    }

    async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto): Promise<MaintenanceDocument> {
        const maintenance = await this.findOne(id);

        if (updateMaintenanceDto.status === MaintenanceStatus.COMPLETED) {
            updateMaintenanceDto.completedDate = new Date();
        }

        return this.maintenanceModel
            .findByIdAndUpdate(id, updateMaintenanceDto, { new: true })
            .populate('automobile')
            .exec();
    }

    async remove(id: string): Promise<void> {
        const maintenance = await this.findOne(id);
        await maintenance.deleteOne();
    }

    private async checkUpcomingMaintenance() {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const upcomingMaintenance = await this.maintenanceModel
            .find({
                scheduledDate: { 
                    $gte: new Date(), 
                    $lte: threeDaysFromNow 
                },
                status: MaintenanceStatus.PLANNED,
                notificationSent: false
            })
            .populate('automobile')
            .exec();

        for (const maintenance of upcomingMaintenance) {
            await this.sendMaintenanceNotifications(maintenance);
            maintenance.notificationSent = true;
            await maintenance.save();
        }
    }

    private async sendMaintenanceNotifications(maintenance: MaintenanceDocument) {
        // Envoyer un email
        await this.mailService.sendMaintenanceNotification(
            maintenance.automobile,
            maintenance
        );

        // Envoyer un SMS si configuré
        if (process.env.SMS_NOTIFICATIONS_ENABLED === 'true') {
            const message = `Maintenance programmée pour ${maintenance.automobile.brand} ${maintenance.automobile.model} le ${maintenance.scheduledDate.toLocaleDateString()}. Type: ${maintenance.type}`;
            
            try {
                await this.smsService.sendMessage(
                    process.env.ADMIN_PHONE_NUMBER,
                    message
                );
            } catch (error) {
                console.error('Failed to send SMS notification:', error);
            }
        }
    }

    async getMaintenanceStats(startDate: Date, endDate: Date) {
        const stats = await this.maintenanceModel.aggregate([
            {
                $match: {
                    scheduledDate: { $gte: startDate, $lte: endDate },
                    status: MaintenanceStatus.COMPLETED
                }
            },
            {
                $group: {
                    _id: '$type',
                    totalCost: { $sum: '$cost' },
                    count: { $sum: 1 }
                }
            }
        ]);

        return stats;
    }
} 