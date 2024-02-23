import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Section, SectionDocument } from 'src/section/section.model';
import { LessonDto } from './lesson.dto';
import { Lesson, LessonDocument } from './lesson.model';

@Injectable()
export class LessonService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<SectionDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  async createLesson(body: LessonDto, sectionId: string) {
    const lesson = await this.lessonModel.create(body)
    const section = await this.sectionModel
      .findByIdAndUpdate(sectionId, {$push: {lessons: lesson}}, {new: true})
      .populate('lessons')

    return section
  }

  async editLesson(body: LessonDto, lessonId: string) {
    return await this.lessonModel.findByIdAndUpdate(lessonId, body, {new: true})
  }

  async deleteLesson(lessonId: string, sectionId: string) {
    await this.lessonModel.findByIdAndRemove(lessonId)
    const section = await this.sectionModel
      .findByIdAndUpdate(sectionId, {$pull: {lessons: lessonId}}, {new: true})
      .populate('lessons')

    return section
  }

  async getLesson(sectionId: string) {
    const section = await this.sectionModel.findById(sectionId).populate('lessons')

    return section.lessons
  }

  async completeLesson(userId: string, lessonId: string) {
    return await this.lessonModel.findByIdAndUpdate(lessonId, {$push: {completed: userId}}, {new: true})
  }

  async uncompleteLesson(userId: string, lessonId: string) {
    return await this.lessonModel.findByIdAndUpdate(lessonId, {$pull: {completed: userId}}, {new: true})
  }
}
