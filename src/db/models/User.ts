import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password: string;
}

const schema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    {
        collection: 'users',
        timestamps: true,
    }
);

export default model<IUser>('User', schema);
