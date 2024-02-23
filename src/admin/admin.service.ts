import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectStripe } from 'nestjs-stripe';
import { Course, CourseDocument } from 'src/course/course.model';
import {
  Instructor,
  InstructorDocument,
} from 'src/instructor/instructor.model';
import { User, UserDocument } from 'src/user/user.model';
import Stripe from 'stripe';
import * as SendGrid from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Instructor.name)
    private instructorModel: Model<InstructorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectStripe() private readonly stripeClient: Stripe,
    private readonly configService: ConfigService,
  ) {
    SendGrid.setApiKey(this.configService.get<string>('SEND_GRID_KEY'));
  }

  async getAllInstructors() {
    const instructors = await this.instructorModel
      .find()
      .populate('author')
      .exec();

    return instructors.map((instructor) => this.getSpecificField(instructor));
  }

  async approveInstructor(instructorId: string) {
    const instructor = await this.instructorModel.findByIdAndUpdate(
      instructorId,
      { $set: { approved: true } },
      { new: true },
    );

    const user = await this.userModel.findById(instructor.author);

    const account = await this.stripeClient.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const accountLink = await this.stripeClient.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000',
      return_url: 'http://localhost:3000',
      type: 'account_onboarding',
    });

    await this.userModel.findByIdAndUpdate(
      instructor.author,
      { $set: { role: 'INSTRUCTOR', instructorAccountId: account.id } },
      { new: true },
    );

    const emailData = {
      to: user.email,
      subject: 'Successfully approved',
      from: 'djwandwauncjsnadwa@gmail.com',
      html: `
        <p>Hi dear ${user.fullName}, you approved to our platform like Instructor, follow the bellow steps.</p>
        <a href="${accountLink.url}">Full finish your instructor account</a>
      `,
    };

    await SendGrid.send(emailData);
    return 'Success';
  }

  async deleteInstructor(instructorId: string) {
    const instructor = await this.instructorModel.findByIdAndUpdate(
      instructorId,
      { $set: { approved: false } },
      { new: true },
    );
    await this.userModel.findByIdAndUpdate(
      instructor.author,
      { $set: { role: 'USER' } },
      { new: true },
    );
    return 'Success';
  }

  async getAllUsers(limit: number) {
    const users = await this.userModel
      .find()
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    return users.map((user) => this.getUserSpecificField(user));
  }

  async searchedUsers(email: string, limit: number) {
    let users: UserDocument[];
    if (email) {
      users = await this.userModel.find().exec();
    } else {
      users = await this.userModel.find().limit(limit).exec();
    }
    const searchedUser = users.filter(
      (user) => user.email.toLowerCase().indexOf(email.toLowerCase()) !== -1,
    );

    return searchedUser.map((user) => this.getUserSpecificField(user));
  }

  async deleteCourse(courseId: string) {
    const courseAuthor = await this.courseModel.findById(courseId);
    await this.instructorModel.findOneAndUpdate(
      { author: courseAuthor.author },
      { $pull: { courses: courseId } },
      { new: true },
    );
    await this.courseModel.findByIdAndRemove(courseId, { new: true }).exec();
    const courses = await this.courseModel.find().exec();
    return courses.map((course) => this.getCourseSpecificField(course));
  }

  getSpecificField(instructor: InstructorDocument) {
    return {
      _id: instructor._id,
      approved: instructor.approved,
      socialMedia: instructor.socialMedia,
      author: {
        fullName: instructor.author.fullName,
        email: instructor.author.email,
        job: instructor.author.job,
      },
    };
  }

  getUserSpecificField(user: UserDocument) {
    return {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  getCourseSpecificField(course: CourseDocument) {
    return {
      title: course.title,
      previewImage: course.previewImage,
      price: course.price,
      isActive: course.isActive,
      language: course.language,
      _id: course._id,
    };
  }
}
