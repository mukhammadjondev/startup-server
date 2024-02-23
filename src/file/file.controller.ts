import { Controller, HttpCode, Post, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @HttpCode(200)
  @Post('save')
  @UseInterceptors(FileInterceptor('image'))
  async saveFile(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    return this.fileService.saveFile(file, folder)
  }
}
