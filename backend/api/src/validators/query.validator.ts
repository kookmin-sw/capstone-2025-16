import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class PaginationQueryValidator {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;
}

export class SortQueryValidator {
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(["asc", "desc"])
  order?: "asc" | "desc";
}

export class SearchQueryValidator {
  @IsOptional()
  @IsString()
  search?: string;
}

export class CohortQueryValidator extends PaginationQueryValidator {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsString()
  createdAt?: string;
}
