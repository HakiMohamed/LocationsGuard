import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument, ReservationStatus } from '../schemas/reservation.schema';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { AutomobileService } from '../../automobile/services/automobile.service';
import { ClientService } from '../../client/services/client.service';

@Injectable()
export class ReservationService {
    constructor(
        @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
        private readonly automobileService: AutomobileService,
        private readonly clientService: ClientService,
    ) {}

    async create(createReservationDto: CreateReservationDto): Promise<any> {
        // Vérifier si l'automobile est disponible pour ces dates
        const isAvailable = await this.checkAvailability(
            createReservationDto.automobile,
            createReservationDto.startDate,
            createReservationDto.endDate
        );

        if (!isAvailable) {
            throw new BadRequestException('Cette automobile n\'est pas disponible pour ces dates');
        }

        // Calculer le prix total
        const totalPrice = await this.calculateTotalPrice(
            createReservationDto.automobile,
            new Date(createReservationDto.startDate),
            new Date(createReservationDto.endDate)
        );

        try {
            const reservation = new this.reservationModel({
                ...createReservationDto,
                totalPrice,
                status: ReservationStatus.PENDING
            });

            const savedReservation = await reservation.save();
            
            return {
                success: true,
                message: 'Réservation créée avec succès',
                data: savedReservation
            };
        } catch (error) {
            throw new BadRequestException('Erreur lors de la création de la réservation');
        }
    }

    async findAll(page: number = 1, limit: number = 10, status?: string): Promise<any> {
        const query = status ? { status } : {};
        const total = await this.reservationModel.countDocuments(query);
        const reservations = await this.reservationModel
            .find(query)
            .populate('client', '-password -devices')
            .populate('automobile')
            .populate('category')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();

        return {
            success: true,
            data: reservations,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async findByAutomobile(automobileId: string, status?: string): Promise<any> {
        const query = { 
            automobile: automobileId,
            ...(status && { status })
        };

        const reservations = await this.reservationModel
            .find(query)
            .populate('client', '-password -devices')
            .populate('automobile')
            .sort({ startDate: -1 })
            .exec();

        return {
            success: true,
            data: reservations
        };
    }

    async findByClient(clientId: string, status?: string): Promise<any> {
        const query = { 
            client: clientId,
            ...(status && { status })
        };

        const reservations = await this.reservationModel
            .find(query)
            .populate('automobile')
            .populate('category')
            .sort({ startDate: -1 })
            .exec();

        return {
            success: true,
            data: reservations
        };
    }

    async findByCategory(categoryId: string, status?: string): Promise<any> {
        const query = { 
            category: categoryId,
            ...(status && { status })
        };

        const reservations = await this.reservationModel
            .find(query)
            .populate('client', '-password -devices')
            .populate('automobile')
            .sort({ startDate: -1 })
            .exec();

        return {
            success: true,
            data: reservations
        };
    }

    async findOne(id: string): Promise<any> {
        const reservation = await this.reservationModel
            .findById(id)
            .populate('client', '-password -devices')
            .populate('automobile')
            .populate('category')
            .exec();

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        return {
            success: true,
            data: reservation
        };
    }

    async update(id: string, updateReservationDto: UpdateReservationDto): Promise<any> {
        const reservation = await this.reservationModel
            .findByIdAndUpdate(id, updateReservationDto, { new: true })
            .populate('client', '-password -devices')
            .populate('automobile')
            .exec();

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        return {
            success: true,
            message: 'Réservation mise à jour avec succès',
            data: reservation
        };
    }

    async cancel(id: string, reason: string): Promise<any> {
        const reservation = await this.reservationModel
            .findByIdAndUpdate(id, {
                status: ReservationStatus.CANCELLED,
                cancellationReason: reason
            }, { new: true })
            .exec();

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        return {
            success: true,
            message: 'Réservation annulée avec succès',
            data: reservation
        };
    }

    async confirm(id: string): Promise<any> {
        const reservation = await this.reservationModel
            .findByIdAndUpdate(id, {
                status: ReservationStatus.CONFIRMED
            }, { new: true })
            .exec();

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        return {
            success: true,
            message: 'Réservation confirmée avec succès',
            data: reservation
        };
    }

    async remove(id: string): Promise<any> {
        const reservation = await this.reservationModel.findByIdAndDelete(id);

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        return {
            success: true,
            message: 'Réservation supprimée avec succès'
        };
    }

    private async checkAvailability(
        automobileId: string,
        startDate: Date,
        endDate: Date
    ): Promise<boolean> {
        const conflictingReservations = await this.reservationModel.find({
            automobile: automobileId,
            status: { $nin: [ReservationStatus.CANCELLED] },
            $or: [
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                }
            ]
        });

        return conflictingReservations.length === 0;
    }

    private async calculateTotalPrice(
        automobileId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const automobile = await this.automobileService.findOne(automobileId);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return automobile.data.dailyRate * days;
    }


    async complete(id: string): Promise<any> {
        const reservation = await this.reservationModel
            .findByIdAndUpdate(id, {
                status: ReservationStatus.COMPLETED
            }, { new: true })
            .exec();    

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        return {
            success: true,
            message: 'Réservation terminée avec succès',
            data: reservation
        };
    }


    async SetPending(id: string): Promise<any> {
        const reservation = await this.reservationModel
            .findByIdAndUpdate(id, {
                status: ReservationStatus.PENDING
            }, { new: true })
            .exec();

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        return {
            success: true,
            message: 'Réservation mise à jour avec succès',
            data: reservation
        };
    }   

} 