import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Instructor,
  InstructorDocument,
} from 'src/instructor/instructor.model';
import { CourseBodyDto } from './course.dto';
import { Course, CourseDocument } from './course.model';
import { User, UserDocument } from 'src/user/user.model';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Instructor.name)
    private instructorModel: Model<InstructorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createCourse(dto: CourseBodyDto, id: string) {
    const slugify = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const slug = slugify(dto.title);
    const course = await this.courseModel.create({ ...dto, slug, author: id });
    await this.instructorModel.findOneAndUpdate(
      { author: id },
      { $push: { courses: course._id } },
      { new: true },
    );
    return 'Success';
  }

  async editCourse(dto: CourseBodyDto, courseId: string) {
    return await this.courseModel.findByIdAndUpdate(courseId, dto, {
      new: true,
    });
  }

  async deleteCourse(courseId: string, userId: string) {
    await this.courseModel.findByIdAndRemove(courseId);
    await this.instructorModel.findOneAndUpdate(
      { author: userId },
      { $pull: { courses: courseId } },
      { new: true },
    );
    return 'Success';
  }

  async activateCourse(courseId: string) {
    const course = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $set: { isActive: true } },
      { new: true },
    );
    return course;
  }

  async draftCourse(courseId: string) {
    const course = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $set: { isActive: false } },
      { new: true },
    );
    return course;
  }

  async getCourses(language: string, limit: string) {
    const courses = await this.courseModel
      .find({ language })
      .populate({ path: 'sections', populate: { path: 'lessons' } })
      .populate('author')
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .exec();

    return courses.map((course) => this.getSpecificFieldCourse(course));
  }

  async getDetailedCourse(slug: string) {
    const course = await this.courseModel
      .findOne({ slug })
      .populate({ path: 'sections', populate: { path: 'lessons' } })
      .populate('author')
      .exec();

    return this.getSpecificFieldCourse(course);
  }

  getSpecificFieldCourse(course: CourseDocument) {
    return {
      _id: course._id,
      title: course.title,
      previewImage: course.previewImage,
      price: course.price,
      level: course.level,
      category: course.category,
      author: {
        fullName: course.author.fullName,
        avatar: course.author.avatar,
        job: course.author.job,
      },
      updatedAt: course.updatedAt,
      learn: course.learn,
      requirements: course.requirements,
      description: course.description,
      language: course.language,
      excerpt: course.excerpt,
      slug: course.slug,
      lessonCount: course.sections
        .map((c) => c.lessons.length)
        .reduce((a, b) => +a + +b, 0),
      totalHour: this.getTotalHours(course),
    };
  }

  getTotalHours(course: CourseDocument) {
    let totalHour = 0;

    for (let s = 0; s < course.sections.length; s++) {
      const section = course.sections[s];
      let sectionHour = 0;

      for (let l = 0; l < section.lessons.length; l++) {
        const lesson = section.lessons[l];
        const hours = parseInt(String(lesson.hour));
        const minutes = parseInt(String(lesson.minute));
        const seconds = parseInt(String(lesson.second));
        const totalMinutes = hours * 60 + minutes;
        const totalSeconds = totalMinutes * 60 + seconds;
        const totalHourLesson = totalSeconds / 3600;
        sectionHour += totalHourLesson;
      }
      totalHour += sectionHour;
    }
    return totalHour.toFixed(1);
  }

  async getAdminCourses() {
    return this.courseModel.find().exec();
  }

  async enrollUser(userId: string, courseId: string) {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $push: { courses: courseId } },
      { new: true },
    );

    return 'Success';
  }
}
