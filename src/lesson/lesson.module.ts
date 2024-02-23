import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Section, SectionSchema } from 'src/section/section.model';
import { Lesson, LessonSchema } from './lesson.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Section.name, schema: SectionSchema},
      {name: Lesson.name, schema: LessonSchema},
    ]),
  ],
  providers: [LessonService],
  controllers: [LessonController]
})
export class LessonModule {}
