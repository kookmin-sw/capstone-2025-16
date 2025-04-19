import { IsOptional, IsNumber } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number;
}
