import { IsOptional, IsNumber } from "class-validator";
import { Type } from "class-transformer";

/**
 * @swagger
 * components:
 *   parameters:
 *     Pagination:
 *       name: page
 *       in: query
 *       schema:
 *         type: integer
 *       description: 페이지 번호
 *   schemas:
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: 페이지 번호
 */
export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;
}
