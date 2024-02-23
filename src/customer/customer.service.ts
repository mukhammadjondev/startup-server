import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectStripe } from 'nestjs-stripe';
import { User, UserDocument } from 'src/user/user.model';
import Stripe from 'stripe';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectStripe() private readonly stripeClient: Stripe,
  ) {}

  async createCustomer(userId: string) {
    const user = await this.userModel.findById(userId);
    const { email } = user;

    const customer = await this.stripeClient.customers.create({
      email,
      metadata: {
        customerUID: userId,
      },
    });

    const updateUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { customerId: customer.id } },
      { new: true },
    );
    updateUser.save();

    return customer;
  }

  async getCustomer(userId: string) {
    const user = await this.userModel.findById(userId);
    const { customerId } = user;

    if (!customerId) {
      this.createCustomer(userId);
    }

    const customer = await this.stripeClient.customers.retrieve(customerId);
    return customer;
  }

  async atachPaymentMethod(paymentMethod: string, userId: string) {
    const customer = await this.getCustomer(userId);

    const atachedCard = await this.stripeClient.paymentMethods.attach(
      paymentMethod,
      { customer: customer.id },
    );

    return atachedCard;
  }

  async savedCustomerCard(customerId: string) {
    if (!customerId) throw new UnauthorizedException();

    const cards = await this.stripeClient.paymentMethods.list({
      customer: customerId,
      limit: 3,
      type: 'card',
    });

    return cards.data;
  }
}
