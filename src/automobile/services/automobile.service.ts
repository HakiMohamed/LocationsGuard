import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Automobile, AutomobileDocument } from '../schemas/automobile.schema';
import { CreateAutomobileDto } from '../dto/create-automobile.dto';
import { UpdateAutomobileDto } from '../dto/update-automobile.dto';
import { Reservation, ReservationDocument } from '../../reservation/schemas/reservation.schema';

@Injectable()
export class AutomobileService {
    constructor(
        @InjectModel(Automobile.name) private automobileModel: Model<AutomobileDocument>,
        @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    ) {}

    async create(createAutomobileDto: CreateAutomobileDto): Promise<any> {
        try {
            const createdAutomobile = new this.automobileModel(createAutomobileDto);
            const savedAutomobile = await createdAutomobile.save();
            return {
                success: true,
                message: 'Automobile créée avec succès',
                data: savedAutomobile,
            };
        } catch (error) {
            throw new InternalServerErrorException({
                success: false,
                message: 'Erreur lors de la création de l\'automobile',
                error: error.message,
            });
        }
    }

    async findAll(): Promise<any> {
        try {
            const automobiles = await this.automobileModel.find().exec();
            return {
                success: true,
                message: 'Liste des automobiles récupérée avec succès',
                data: automobiles,
            };
        } catch (error) {
            throw new InternalServerErrorException({
                success: false,
                message: 'Erreur lors de la récupération des automobiles',
                error: error.message,
            });
        }
    }

    async findOne(id: string): Promise<any> {
        try {
            const automobile = await this.automobileModel.findById(id).exec();
            if (!automobile) {
                throw new NotFoundException({
                    success: false,
                    message: `Automobile avec l'ID ${id} non trouvée`,
                });
            }
            return {
                success: true,
                message: 'Automobile récupérée avec succès',
                data: automobile,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException({
                success: false,
                message: 'Erreur lors de la récupération de l\'automobile',
                error: error.message,
            });
        }
    }

    async update(id: string, updateAutomobileDto: UpdateAutomobileDto): Promise<any> {
        try {
            const updatedAutomobile = await this.automobileModel
                .findByIdAndUpdate(id, updateAutomobileDto, { new: true })
                .exec();
            if (!updatedAutomobile) {
                throw new NotFoundException({
                    success: false,
                    message: `Automobile avec l'ID ${id} non trouvée`,
                });
            }
            return {
                success: true,
                message: 'Automobile mise à jour avec succès',
                data: updatedAutomobile,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException({
                success: false,
                message: 'Erreur lors de la mise à jour de l\'automobile',
                error: error.message,
            });
        }
    }

    async remove(id: string): Promise<any> {
        try {
            const result = await this.automobileModel.deleteOne({ _id: id }).exec();
            if (result.deletedCount === 0) {
                throw new NotFoundException({
                    success: false,
                    message: `Automobile avec l'ID ${id} non trouvée`,
                });
            }
            return {
                success: true,
                message: 'Automobile supprimée avec succès',
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException({
                success: false,
                message: 'Erreur lors de la suppression de l\'automobile',
                error: error.message,
            });
        }
    }

    async updateAvailability(id: string, updateAutomobileDto: UpdateAutomobileDto): Promise<any> {
        try {
            const updatedAutomobile = await this.automobileModel
                .findByIdAndUpdate(id, updateAutomobileDto, { new: true })
                .exec();
            if (!updatedAutomobile) {
                throw new NotFoundException({
                    success: false,
                    message: `Automobile avec l'ID ${id} non trouvée`,
                });
            }
            return {
                success: true,
                message: 'Disponibilité de l\'automobile mise à jour avec succès',
                data: updatedAutomobile,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException({
                success: false,
                message: 'Erreur lors de la mise à jour de la disponibilité',
                error: error.message,
            });
        }
    }

    async findByCategory(categoryId: string): Promise<any> {
        try {
            const automobiles = await this.automobileModel
                .find({ category: categoryId })
                .populate('category')
                .exec();
            
            return {
                success: true,
                message: 'Automobiles de la catégorie récupérées avec succès',
                data: automobiles,
            };
        } catch (error) {
            throw new InternalServerErrorException({
                success: false,
                message: 'Erreur lors de la récupération des automobiles par catégorie',
                error: error.message,
            });
        }
    }

    async getCategoryCount(categoryId: string): Promise<any> {
        try {
            const count = await this.automobileModel
                .countDocuments({ category: categoryId })
                .exec();
            
            return {
                success: true,
                message: 'Nombre d\'automobiles dans la catégorie récupéré avec succès',
                data: { count },
            };
        } catch (error) {
            throw new InternalServerErrorException({
                success: false,
                message: 'Erreur lors du comptage des automobiles',
                error: error.message,
            });
        }
    }

    async getMostReservedAutomobiles(limit: number = 5): Promise<any> {
        const reservationStats = await this.reservationModel.aggregate([
            {
                $group: {
                    _id: '$automobile',
                    reservationCount: { $sum: 1 }
                }
            },
            {
                $sort: { reservationCount: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'automobiles',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'automobileDetails'
                }
            },
            {
                $unwind: '$automobileDetails'
            },
            {
                $project: {
                    _id: '$automobileDetails._id',
                    brand: '$automobileDetails.brand',
                    model: '$automobileDetails.model',
                    year: '$automobileDetails.year',
                    categoryId: '$automobileDetails.category',
                    reservationCount: 1
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $unwind: '$categoryDetails'
            },
            {
                $project: {
                    automobileId: '$_id',
                    brand: 1,
                    model: 1,
                    year: 1,
                    categoryId: 1,
                    categoryName: '$categoryDetails.name',
                    reservationCount: 1
                }
            }
        ]);

        return {
            success: true,
            data: reservationStats
        };
    }

    async getLeastReservedAutomobiles(limit: number = 5): Promise<any> {
        const allAutomobiles = await this.automobileModel
            .find()
            .populate('category', 'name')
            .lean();
        
        const reservationStats = await this.reservationModel.aggregate([
            {
                $group: {
                    _id: '$automobile',
                    reservationCount: { $sum: 1 }
                }
            }
        ]);

        const reservationCountMap = new Map(
            reservationStats.map(stat => [stat._id.toString(), stat.reservationCount])
        );

        const automobilesWithCounts = allAutomobiles.map(auto => ({
            automobileId: auto._id,
            brand: auto.brand,
            model: auto.model,
            year: auto.year,
            categoryId: (auto.category as any)._id,
            categoryName: (auto.category as any).name,
            reservationCount: reservationCountMap.get(auto._id.toString()) || 0
        }));

        const sortedAutomobiles = automobilesWithCounts
            .sort((a, b) => a.reservationCount - b.reservationCount)
            .slice(0, limit);

        return {
            success: true,
            data: sortedAutomobiles
        };
    }
}