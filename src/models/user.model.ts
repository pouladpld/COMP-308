import * as mongoose from 'mongoose';
import * as crypto from 'crypto';
// import {CourseModelName} from './course.model'; // ToDo remove

export const UserModelName = 'user';

export interface IUserModel extends mongoose.Document {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    role: string;
    password: string;
    salt: string;

    courses: mongoose.Schema.Types.ObjectId[]; // ToDo remove

    hashPassword(password: string): string;

    verifyPassword(password: string): boolean;

    toDTO(): any;
}

export function registerModelStudent() {
    const UserSchema = new mongoose.Schema({
        firstName: {
            type: String,
            required: 'First name is required',
        },
        lastName: {
            type: String,
            required: 'Last name is required',
        },
        email: {
            type: String,
            match: [/.+@.+\..+/, 'Please fill a valid email address'],
            unique: true
        },
        address: {
            type: String,
            required: 'Address is required',
        },
        role: {
            type: String,
            required: 'Role is required',
            enum: ['patient', 'nurse']
        },
        password: {
            type: String,
            required: 'Password is required',
            validate: [
                password => password && password.length >= 6,
                'Password should be longer'
            ]
        },
        salt: String
    });

    UserSchema.pre('save', function (next) {
        const user: IUserModel = this;

        if (!user.isModified('password')) {
            return next();
        }

        user.salt = crypto.randomBytes(16).toString('base64');
        user.password = user.hashPassword(user.password);

        next();
    });

    UserSchema.methods.hashPassword = function (password: string): string {
        const user: IUserModel = this;
        return crypto
            .pbkdf2Sync(password, user.salt, 1000, 64, 'sha1')
            .toString('base64');
    };

    UserSchema.methods.verifyPassword = function (password: string) {
        const user: IUserModel = this;
        return user.password === user.hashPassword(password);
    };

    UserSchema.methods.toDTO = function () {
        const user: IUserModel = this;

        const dto = user.toObject();

        dto.id = dto._id;
        delete dto._id;
        delete dto.password;
        delete dto.salt;
        delete dto.__v;

        return dto;
    };

    mongoose.model(UserModelName, UserSchema);
}

export function getModelUser() {
    return mongoose.model<IUserModel>(UserModelName);
}
