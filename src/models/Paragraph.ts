import { Document, Schema, model } from 'mongoose';

interface IParagraph extends Document {
    index: number;
    paragraph: string;
}

const ParagraphSchema = new Schema<IParagraph>({
    index: { type: Number, required: true, unique: true },
    paragraph: { type: String, required: true, unique: true }
});


const Paragraph = model('Paragraph', ParagraphSchema);

export { IParagraph, Paragraph };