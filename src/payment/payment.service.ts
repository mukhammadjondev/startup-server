import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectStripe } from 'nestjs-stripe';
import { Course, CourseDocument } from 'src/course/course.model';
import { CustomerService } from 'src/customer/customer.service';
import Stripe from 'stripe';
import { PaymentBooksDto } from './dto/payment-books';
import { PaymentCourseDto } from './dto/payment-course';

@Injectable()
export class PaymentService {
  constructor(
    @InjectStripe() private readonly stripeClient: Stripe,
    private readonly customerService: CustomerService,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async paymentBooks(body: PaymentBooksDto, userId: string) {
    const customer = await this.customerService.getCustomer(userId);
    const card = await this.customerService.atachPaymentMethod(
      body.paymentMethod,
      userId,
    );

    const paymnetIntent = await this.stripeClient.paymentIntents.create({
      amount: body.price * 100,
      currency: 'usd',
      payment_method: card.id,
      customer: customer.id,
    });

    return paymnetIntent.client_secret;
  }

  async paymentCourses(body: PaymentCourseDto, userId: string) {
    const customer = await this.customerService.getCustomer(userId);
    const card = await this.customerService.atachPaymentMethod(
      body.paymentMethod,
      userId,
    );
    const course = await this.courseModel
      .findById(body.courseId)
      .populate('author');

    const feePrice = (30 / 100) * body.price;

    const paymnetIntent = await this.stripeClient.paymentIntents.create({
      amount: body.price * 100,
      currency: 'usd',
      payment_method: card.id,
      customer: customer.id,
      application_fee_amount: feePrice * 100,
      transfer_data: {
        destination: course.author.instructorAccountId,
      },
    });

    return paymnetIntent.client_secret;
  }

  async listProducts() {
    const products = await this.stripeClient.products.list({
      limit: 3,
      expand: ['data.default_price'],
    });
    return products.data;
  }

  async createSubscription(body: PaymentBooksDto, userId: string) {
    const customer = await this.customerService.getCustomer(userId);
    const card = await this.customerService.atachPaymentMethod(
      body.paymentMethod,
      userId,
    );

    const subscription = await this.stripeClient.subscriptions.create({
      customer: customer.id,
      items: [{ price: String(body.price) }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      default_payment_method: card.id,
    });
    // @ts-ignore
    return subscription.latest_invoice.payment_intent.client_secret;
  }
}
