import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { genSalt, hash } from 'bcryptjs';
import { Model } from 'mongoose';
import { InterfaceEmailAndPassword, UpdateUserDto } from './user.interface';
import { User, UserDocument } from './user.model';
import Stripe from 'stripe';
import { InjectStripe } from 'nestjs-stripe';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectStripe() private readonly stripeClient: Stripe,
  ) {}

  async byId(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) throw new NotFoundException('user_not_found');

    return user;
  }

  async editPassword(dto: InterfaceEmailAndPassword) {
    const { email, password } = dto;

    const existUser = await this.userModel.findOne({ email });
    if (!existUser) throw new UnauthorizedException('user_not_found');

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    await this.userModel.findByIdAndUpdate(
      existUser._id,
      { $set: { password: hashedPassword } },
      { new: true },
    );

    return 'Success';
  }

  async updateUser(body: UpdateUserDto, userId: string) {
    const { firstName, lastName, bio, birthday, avatar, job } = body;

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          fullName: `${firstName} ${lastName}`,
          avatar,
          bio,
          birthday,
          job,
        },
      },
      { new: true },
    );

    return user;
  }

  async allTransactions(customerId: string) {
    const transactions = await this.stripeClient.charges.list({
      customer: customerId,
      limit: 100,
    });

    return transactions.data;
  }

  async myCourses(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('courses')
      .exec();

    return user.courses;
  }
}
