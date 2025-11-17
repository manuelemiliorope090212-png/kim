import mongoose, { Schema, Document } from 'mongoose';

export interface IMemory extends Document {
  type: 'drawing' | 'letter' | 'photo' | 'note';
  title: string;
  content: string; // text for notes/letters, Cloudinary URL for images
  date: Date;
  createdAt: Date;
}

const MemorySchema: Schema = new Schema({
  type: { type: String, required: true, enum: ['drawing', 'letter', 'photo', 'note'] },
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Memory || mongoose.model<IMemory>('Memory', MemorySchema);