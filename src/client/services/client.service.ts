import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { CreateClientDto, UpdateClientDto } from '../dto/create-client.dto';
import { UserRole } from '../../auth/enums/role.enum';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class ClientService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private mailService: MailService,
    ) {}

    private generatePassword(): string {
        // Génère un mot de passe aléatoire de 10 caractères
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    async create(createClientDto: CreateClientDto): Promise<any> {
        let newClient;
        try {
            // Générer un mot de passe aléatoire
            const password = this.generatePassword();
            const hashedPassword = await bcrypt.hash(password, 12);

            // Créer le client avec le rôle CLIENT
            newClient = await this.userModel.create({
                ...createClientDto,
                email: createClientDto.email.toLowerCase(),
                password: hashedPassword,
                role: UserRole.CLIENT,
                isEmailVerified: true, // On peut considérer que le client est déjà vérifié puisque c'est l'admin qui le crée
            });

            // Envoyer les credentials par email
            try {
                await this.mailService.sendClientCredentials(newClient, password);
            } catch (emailError) {
                // Si l'envoi d'email échoue, supprimer le client créé
                await this.userModel.findByIdAndDelete(newClient._id);
                throw new BadRequestException('Erreur lors de l\'envoi des credentials par email');
            }

            return {
                _id: newClient._id,
                email: newClient.email,
                firstName: newClient.firstName,
                lastName: newClient.lastName,
                phoneNumber: newClient.phoneNumber,
            };
        } catch (error) {
            // Si le client a été créé mais qu'une erreur survient après, le supprimer
            if (newClient?._id) {
                await this.userModel.findByIdAndDelete(newClient._id);
            }

            if (error.code === 11000) {
                throw new ConflictException('Un client avec cet email existe déjà');
            }
            throw new BadRequestException('Erreur lors de la création du client');
        }
    }

    async findAll() {
        return this.userModel
            .find({ role: UserRole.CLIENT })
            .select('-password -devices')
            .exec();
    }

    async findOne(id: string) {
        const client = await this.userModel
            .findOne({ _id: id, role: UserRole.CLIENT })
            .select('-password -devices ')
            .exec();

        if (!client) {
            throw new BadRequestException('Client non trouvé');
        }

        return client;
    }

    async update(id: string, updateClientDto: UpdateClientDto) {
        return this.userModel.findByIdAndUpdate(id, updateClientDto, { new: true });
    }

    async remove(id: string) {
        return this.userModel.findByIdAndDelete(id);
    }

    async search(search: string) {
        const query = {
            role: UserRole.CLIENT,
            $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ]
        };
        
        return this.userModel.find(query).exec();
    }

    async getClientRentals(id: string) {
        // Implement method to get client rentals
        return []; // Placeholder, replace with actual implementation
    }

    async getClientStatistics(id: string) {
        // Implement method to get client statistics
        return {}; // Placeholder, replace with actual implementation
    }

    // Autres méthodes selon vos besoins (update, delete, etc.)
} 