import { Schema, model } from 'mongoose';

const schema = new Schema(
    {
        username: String,
        password: String,
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

export default model('User', schema);
