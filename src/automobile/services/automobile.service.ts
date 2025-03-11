import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Automobile, AutomobileDocument } from '../schemas/automobile.schema';
import { CreateAutomobileDto } from '../dto/create-automobile.dto';
import { UpdateAutomobileDto } from '../dto/update-automobile.dto';

@Injectable()
export class AutomobileService {
    constructor(
        @InjectModel(Automobile.name) private automobileModel: Model<AutomobileDocument>,
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
}