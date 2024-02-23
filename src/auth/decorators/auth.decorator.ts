import { applyDecorators, UseGuards } from "@nestjs/common";
import { RoleUser } from "src/user/user.interface";
import { OnlyAminGuard } from "../guards/admin.guard";
import { OnlyInstructorGuard } from "../guards/instructor.guard";
import { JwtAuthGuard } from "../guards/jwt.guard";

export const Auth = (role: RoleUser = 'USER') => {
  return applyDecorators(
    (role === 'ADMIN' && UseGuards(JwtAuthGuard, OnlyAminGuard)) ||
    (role === 'USER' && UseGuards(JwtAuthGuard)) ||
    (role === 'INSTRUCTOR' && UseGuards(JwtAuthGuard, OnlyInstructorGuard))
  )
}