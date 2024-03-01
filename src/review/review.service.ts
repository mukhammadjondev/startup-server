import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Review, ReviewDocument } from './review.model';
import { Model } from 'mongoose';
import { CreateReviewDto, EditReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async createReview(dto: CreateReviewDto) {
    const review = await this.reviewModel.create(dto);
    return review._id;
  }

  async deleteReview(reviewId: string) {
    const review = await this.reviewModel.findByIdAndRemove(reviewId);
    return review._id;
  }

  async editReview(reviewId: string, dto: EditReviewDto) {
    const review = await this.reviewModel.findByIdAndUpdate(
      reviewId,
      { $set: { rating: dto.rating, summary: dto.summary } },
      { new: true },
    );
    return review._id;
  }

  async getReview(courseId: string) {
    const review = await this.reviewModel.find({ course: courseId });
    return review;
  }
}