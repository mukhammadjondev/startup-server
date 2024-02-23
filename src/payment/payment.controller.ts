import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { PaymentBooksDto } from './dto/payment-books';
import { PaymentCourseDto } from './dto/payment-course';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @HttpCode(200)
  @Post('books')
  @Auth('USER')
  paymentBooks(@Body() dto: PaymentBooksDto, @User('_id') _id: string) {
    return this.paymentService.paymentBooks(dto, _id);
  }

  @HttpCode(200)
  @Post('courses')
  @Auth('USER')
  paymentCourses(@Body() dto: PaymentCourseDto, @User('_id') _id: string) {
    return this.paymentService.paymentCourses(dto, _id);
  }

  @HttpCode(200)
  @Get('list-products')
  listProducts() {
    return this.paymentService.listProducts();
  }

  @HttpCode(200)
  @Post('create-subscription')
  @Auth('USER')
  createSubscription(@Body() dto: PaymentBooksDto, @User('_id') _id: string) {
    return this.paymentService.createSubscription(dto, _id);
  }
}
