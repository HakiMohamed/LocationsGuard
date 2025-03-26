import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AutomobileSchema } from './automobile.schema';
import { Connection } from 'mongoose';

@Schema({ timestamps: true })
export class Category {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop()
    description?: string;

    @Prop()
    imageUrl?: string;
}

export type CategoryDocument = Category & Document;
export const CategorySchema = SchemaFactory.createForClass(Category);

// Cascade delete middleware
CategorySchema.pre('deleteOne', { document: false, query: true }, async function() {
    const categoryId = this.getQuery()['_id'];
    const connection: Connection = this.model.db;
    const AutomobileModel = connection.model('Automobile', AutomobileSchema);
    await AutomobileModel.deleteMany({ category: categoryId }).exec();
});