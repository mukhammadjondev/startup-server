import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RoleUser } from './user.interface';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  fullName: string;

  @Prop()
  password: string;

  @Prop()
  role: RoleUser;

  @Prop()
  avatar: string;

  @Prop()
  job: string;

  @Prop()
  customerId: string;

  @Prop()
  instructorAccountId: string;

  @Prop()
  createdAt: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
