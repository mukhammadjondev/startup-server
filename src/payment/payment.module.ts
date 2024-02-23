import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeModule } from 'nestjs-stripe';
import { Course, CourseSchema } from 'src/course/course.model';
import { CustomerModule } from 'src/customer/customer.module';
import { CustomerService } from 'src/customer/customer.service';
import { User, UserSchema } from 'src/user/user.model';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CustomerModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_SECRET_KEY,
      apiVersion: '2023-10-16',
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, CustomerService],
})
export class PaymentModule {}
