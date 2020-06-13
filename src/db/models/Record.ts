import { Schema, model, Document } from 'mongoose';

export interface IRecord extends Document {
    username: string;
    wpm: string;
}

const schema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        wpm: {
            type: Number,
            required: true,
        },
    },
    {
        collection: 'records',
        timestamps: true,
    }
);

export default model<IRecord>('Record', schema);
