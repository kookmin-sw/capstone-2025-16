import { Type } from "class-transformer";
import {
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  ValidateNested,
  IsBoolean,
  ValidateIf,
} from "class-validator";
import { CohortDefinitionValidator } from "../validators/cohort-definition.validator";

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCohortRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 코호트 이름
 *         description:
 *           type: string
 *           description: 코호트 설명
 *         cohortDefinition:
 *           type: object
 *           description: 코호트 정의
 *         temporary:
 *           type: boolean
 *           description: 임시 코호트 여부
 */
export class CreateCohortRequestDto {
  @ValidateIf((o) => !o.temporary)
  @IsString()
  name?: string;

  @ValidateIf((o) => !o.temporary)
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => CohortDefinitionValidator)
  cohortDefinition?: CohortDefinitionValidator;

  @IsOptional()
  @IsBoolean()
  temporary?: boolean;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateCohortRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 코호트 이름
 *         description:
 *           type: string
 *           description: 코호트 설명
 *         cohortDefinition:
 *           type: object
 *           description: 코호트 정의
 */
export class UpdateCohortRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CohortDefinitionValidator)
  cohortDefinition?: CohortDefinitionValidator;
}

/**
 * @swagger
 * components:
 *   parameters:
 *     CohortId:
 *       name: cohortId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: 코호트 ID
 */
export class CohortIdParamDto {
  @IsString()
  cohortId!: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Cohort:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 코호트 ID
 *         name:
 *           type: string
 *           description: 코호트 이름
 *         description:
 *           type: string
 *           description: 코호트 설명
 *         cohortDefinition:
 *           type: object
 *           description: 코호트 정의
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 생성 시간
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 수정 시간
 */
