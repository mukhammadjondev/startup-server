import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as SendGrid from '@sendgrid/mail';
import { compare, genSalt, hash } from 'bcryptjs';
import { Model } from 'mongoose';
import { Books, BooksDocument } from 'src/books/books.model';
import { User, UserDocument } from 'src/user/user.model';
import { Otp, OtpDocument } from './otp.model';
import { ContactUsDto } from './mail.dto';

@Injectable()
export class MailService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Books.name) private booksModel: Model<BooksDocument>,
    private readonly configService: ConfigService,
  ) {
    SendGrid.setApiKey(this.configService.get<string>('SEND_GRID_KEY'));
  }

  async sendOtpVerification(email: string, isUser: boolean) {
    if (!email) throw new ForbiddenException('email_is_required');

    const existUser = await this.userModel.findOne({ email });
    if (isUser) {
      if (!existUser) throw new BadRequestException('user_not_found');
    } else {
      if (existUser) throw new BadRequestException('already_exist');
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const salt = await genSalt(10);
    const hashedOtp = await hash(String(otp), salt);

    const emailData = {
      to: email,
      subject: 'Verification email',
      from: 'djwandwauncjsnadwa@gmail.com',
      html: `<h1>Verification Code: ${otp}</h1>`,
    };

    await this.otpModel.create({
      email,
      otp: hashedOtp,
      expireAt: Date.now() + 3600000,
    });

    await SendGrid.send(emailData);
    return 'Success';
  }

  async verifyOtp(email: string, otpVerification: string) {
    if (!otpVerification)
      throw new BadRequestException('send_otp_verification');

    const userExistOtp = await this.otpModel.find({ email });
    const { expireAt, otp } = userExistOtp.slice(-1)[0];

    if (expireAt < new Date()) {
      await this.otpModel.deleteMany({ email });
      throw new BadRequestException('expire_code');
    }

    const validOtp = await compare(otpVerification, otp);
    if (!validOtp) throw new BadRequestException('otp_is_incorrect');

    await this.otpModel.deleteMany({ email });
    return 'Success';
  }

  async recieveBooks(bookId: string, userId: string) {
    const user = await this.userModel.findById(userId);
    const book = await this.booksModel.findById(bookId);

    const emailData = {
      to: user.email,
      subject: 'Ordered book',
      from: 'djwandwauncjsnadwa@gmail.com',
      html: `<a href="${book.pdf}">Your ordered book - ${book.title}</a>`,
    };

    await SendGrid.send(emailData);
    return 'Success';
  }

  async contactUs(dto: ContactUsDto) {
    const emailData = {
      to: 'muhsdev@gmail.com',
      subject: 'Contact Us',
      from: 'djwandwauncjsnadwa@gmail.com',
      html: `
        <div>Name: ${dto.name}</div>
        <div>Email: ${dto.email}</div>
        <div>Message: ${dto.message}</div>
      `,
    };

    await SendGrid.send(emailData);
    return 'Success';
  }
}
