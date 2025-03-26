import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument, ReservationStatus } from '../schemas/reservation.schema';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { AutomobileService } from '../../automobile/services/automobile.service';
import { ClientService } from '../../client/services/client.service';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

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
        const isAvailable = await this.checkAvailability(
            updateReservationDto.automobile,
            updateReservationDto.startDate,
            updateReservationDto.endDate,
            id
        );

        if (!isAvailable) {
            throw new BadRequestException('Cette automobile n\'est pas disponible pour ces dates');
        }

        // Re-calculate the total price
        const totalPrice = await this.calculateTotalPrice(
            updateReservationDto.automobile,
            new Date(updateReservationDto.startDate),
            new Date(updateReservationDto.endDate)
        );

        const reservation = await this.reservationModel
            .findByIdAndUpdate(id, { ...updateReservationDto, totalPrice }, { new: true })
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
        endDate: Date,
        reservationId?: string // Add an optional parameter for the current reservation ID
    ): Promise<boolean> {
        const query: any = {
            automobile: automobileId,
            status: { $nin: [ReservationStatus.CANCELLED] },
            $or: [
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                }
            ]
        };

        // Exclude the current reservation from the conflict check
        if (reservationId) {
            query._id = { $ne: reservationId };
        }

        const conflictingReservations = await this.reservationModel.find(query);

        return conflictingReservations.length === 0;
    }

    private async calculateTotalPrice(
        automobileId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const automobile = await this.automobileService.findOne(automobileId);
        const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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


    async updateStatus(id: string, status: string): Promise<any> {
        const reservation = await this.reservationModel
            .findByIdAndUpdate(id, {
                status: status
            }, { new: true })
            .exec();

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        return {
            success: true,
            message: 'Statut de la réservation mis à jour avec succès',
            data: reservation
        };
    }


   // change the status of the reservation to status recieved from the client
   async updatePaymentStatus(id: string, isPaid: boolean): Promise<any> {
    const reservation = await this.reservationModel
        .findByIdAndUpdate(id, {
            isPaid: isPaid  
        }, { new: true })
        .exec();

    if (!reservation) {
        throw new NotFoundException('Réservation non trouvée');
    }

    return {
            success: true,
            message: 'Statut de la réservation mis à jour avec succès',
            data: reservation
        };
    } 

    async generateContract(id: string): Promise<Buffer> {
        const reservation = await this.reservationModel
            .findById(id)
            .populate('client')
            .populate('automobile')
            .exec();

        if (!reservation) {
            throw new NotFoundException('Réservation non trouvée');
        }

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        const chunks: any[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        return new Promise<Buffer>((resolve, reject) => {
            doc.on('end', () => {
                const result = Buffer.concat(chunks);
                resolve(result);
            });
            doc.on('error', reject);

            // Page 1: Contrat principal
            this.generateContractFirstPage(doc, reservation);
            
            // Page 2: Conditions générales
            doc.addPage();
            this.generateContractSecondPage(doc, reservation);

            // Page 3: État de la carrosserie (image)
            doc.addPage();
            this.generateCarrosserieImage(doc);

            // Page 4: Signatures et validations
            doc.addPage();
            this.generateSignaturePage(doc, reservation);

            doc.end();
        });
    }

    private generateContractFirstPage(doc: typeof PDFDocument, reservation: any) {
        // En-tête
        doc.fontSize(20)
            .text('CONTRAT DE LOCATION', { align: 'center' })
            .fontSize(16)
            .text('N° ' + reservation._id, { align: 'center' })
            .moveDown(2);

        // Cadre informations
        doc.fontSize(12)
            .text('DATE DU CONTRAT : ' + new Date().toLocaleDateString('fr-FR'), { align: 'right' })
            .moveDown();

        // Informations du loueur
        doc.font('Helvetica-Bold')
            .text('LOUEUR')
            .font('Helvetica')
            .text('iRent Morocco')
            .text('Société de location de véhicules')
            .text('RC : .........................')
            .text('Tél : ........................')
            .text('Email : ......................')
            .moveDown();

        // Informations du client
        doc.font('Helvetica-Bold')
            .text('LOCATAIRE')
            .font('Helvetica')
            .text(`Nom et prénom : ${reservation.client.firstName} ${reservation.client.lastName}`)
            .text(`Adresse : ${reservation.client.address || '............................'}`)
            .text(`Tél : ${reservation.client.phoneNumber || '............................'}`)
            .text(`Email : ${reservation.client.email}`)
            .text(`N° Permis : ${reservation.client.drivingLicenseNumber || '....................'}`)
            .moveDown();

        // Informations du véhicule
        doc.font('Helvetica-Bold')
            .text('VÉHICULE')
            .font('Helvetica')
            .text(`Marque : ${reservation.automobile.brand}`)
            .text(`Modèle : ${reservation.automobile.model}`)
            .text(`Immatriculation : ${reservation.automobile.licensePlate || '..................'}`)
            .text(`Kilométrage départ : ${reservation.automobile.mileage || '...........'} km`)
            .moveDown();

        // Durée et tarifs
        doc.font('Helvetica-Bold')
            .text('DURÉE ET TARIFS')
            .font('Helvetica')
            .text(`Date de début : ${new Date(reservation.startDate).toLocaleString('fr-FR')}`)
            .text(`Date de fin : ${new Date(reservation.endDate).toLocaleString('fr-FR')}`)
            .text(`Prix journalier : ${reservation.automobile.dailyRate} MAD`)
            .text(`Montant total : ${reservation.totalPrice} MAD`)
            .text('Dépôt de garantie : ................... MAD')
            .moveDown();

        // Pied de page
        doc.fontSize(8)
            .text('Page 1/4', { align: 'center' });
    }

    private generateContractSecondPage(doc: typeof PDFDocument, reservation: any) {
        doc.fontSize(16)
            .text('CONDITIONS GÉNÉRALES DE LOCATION', { align: 'center' })
            .moveDown(2);

        doc.fontSize(12);

        const conditions = [
            {
                title: '1. MISE À DISPOSITION ET RESTITUTION',
                content: 'Le véhicule est délivré en bon état de marche. Le locataire en devient gardien et en assume la pleine responsabilité.'
            },
            {
                title: '2. UTILISATION DU VÉHICULE',
                content: 'Le locataire s\'engage à utiliser le véhicule en "bon père de famille" et à respecter le code de la route.'
            },
            {
                title: '3. ASSURANCE',
                content: 'Le véhicule est couvert par une assurance tous risques avec une franchise de ......... MAD.'
            },
            {
                title: '4. CARBURANT',
                content: 'Le véhicule est livré avec le plein de carburant et doit être restitué de même.'
            },
            {
                title: '5. ENTRETIEN ET RÉPARATIONS',
                content: 'L\'entretien courant et les réparations résultant d\'une usure normale sont à la charge du loueur.'
            },
            {
                title: '6. ACCIDENTS',
                content: 'En cas d\'accident, le locataire s\'engage à prévenir immédiatement le loueur et les autorités compétentes.'
            },
            {
                title: '7. RESPONSABILITÉ',
                content: 'Le locataire est responsable des infractions commises pendant la durée de la location.'
            },
            {
                title: '8. RÉSILIATION',
                content: 'Le contrat peut être résilié de plein droit en cas de non-respect des conditions générales.'
            }
        ];

        conditions.forEach(condition => {
            doc.font('Helvetica-Bold')
                .text(condition.title)
                .font('Helvetica')
                .text(condition.content)
                .moveDown();
        });

        // Pied de page
        doc.fontSize(8)
            .text('Page 2/4', { align: 'center' });
    }

    private generateCarrosserieImage(doc: typeof PDFDocument) {
        // Charger l'image de l'état de la carrosserie
        const imagePath = path.join(process.cwd(), 'uploads', 'images', 'EtatDeCarrosserie.png');
        
        try {
            if (fs.existsSync(imagePath)) {
                doc.image(imagePath, {
                    fit: [500, 700],
                    align: 'center'
                });
            }
        } catch (error) {
            // Handle error silently
        }

        // Pied de page
        doc.fontSize(8)
            .text('Page 3/4', { align: 'center' });
    }

    private generateSignaturePage(doc: typeof PDFDocument, reservation: any) {
        doc.fontSize(16)
            .text('VALIDATION DU CONTRAT', { align: 'center' })
            .moveDown(2);

        // Observations
        doc.fontSize(12)
            .text('OBSERVATIONS AU DÉPART')
            .moveDown()
            .text('.................................................................................................................................')
            .text('.................................................................................................................................')
            .moveDown(2);

        // État du véhicule
        doc.text('ÉTAT DU VÉHICULE AU DÉPART')
            .moveDown()
            .text('Niveau de carburant : ☐ 1/4  ☐ 1/2  ☐ 3/4  ☐ Plein')
            .text('Kilométrage : ' + reservation.automobile.mileage)
            .text('Propreté intérieure : ☐ Propre  ☐ Sale')
            .text('Propreté extérieure : ☐ Propre  ☐ Sale')
            .moveDown(2);

        // Date et lieu
        doc.text(`Fait à ............................., le ${new Date().toLocaleDateString('fr-FR')}`)
            .moveDown(2);

        // Signatures
        doc.text('SIGNATURES', { align: 'center' })
            .moveDown();

        // Au départ
        doc.text('AU DÉPART')
            .moveDown()
            .text('Le Loueur :', { continued: true })
            .text('Le Locataire :', { align: 'right' })
            .moveDown()
            .text('Signature et cachet', { continued: true })
            .text('Lu et approuvé + Signature', { align: 'right' })
            .moveDown(3)
            .text('............................', { continued: true })
            .text('............................', { align: 'right' })
            .moveDown(3);

        // Au retour
        doc.text('AU RETOUR')
            .moveDown()
            .text('Date et heure : .............................')
            .text('Kilométrage : .............................')
            .text('Niveau de carburant : ☐ 1/4  ☐ 1/2  ☐ 3/4  ☐ Plein')
            .moveDown()
            .text('Le Loueur :', { continued: true })
            .text('Le Locataire :', { align: 'right' })
            .moveDown(3)
            .text('............................', { continued: true })
            .text('............................', { align: 'right' });

        // Pied de page
        doc.fontSize(8)
            .moveDown(2)
            .text('Page 4/4', { align: 'center' });
    }
} 
