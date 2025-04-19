import { Router } from "express";
import * as cohortController from "../controllers/cohort.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validator";
import {
  CreateCohortRequestDto,
  UpdateCohortRequestDto,
  CohortIdParamDto,
} from "../dtos/cohort.dto";
import { PaginationDto } from "../dtos/common.dto";

const router = Router();

// GET /cohort - 코호트 리스트 출력
router.get("/", validateQuery(PaginationDto), cohortController.getCohorts);

// POST /cohort - 코호트 생성
router.post(
  "/",
  validateBody(CreateCohortRequestDto),
  cohortController.createNewCohort
);

// GET /cohort/:cohortId - 특정 코호트 정보 출력
router.get(
  "/:cohortId",
  validateParams(CohortIdParamDto),
  cohortController.getCohort
);

// PUT /cohort/:cohortId - 코호트 수정
router.put(
  "/:cohortId",
  validateParams(CohortIdParamDto),
  validateBody(UpdateCohortRequestDto),
  cohortController.updateExistingCohort
);

// DELETE /cohort/:cohortId - 코호트 삭제
router.delete(
  "/:cohortId",
  validateParams(CohortIdParamDto),
  cohortController.removeExistingCohort
);

// GET /cohort/:cohortId/statistics - 특정 코호트 통계 정보 출력
router.get(
  "/:cohortId/statistics",
  validateParams(CohortIdParamDto),
  cohortController.getCohortStatistics
);

// GET /cohort/:cohortId/persons - 특정 코호트 person 리스트 출력
router.get(
  "/:cohortId/persons",
  validateParams(CohortIdParamDto),
  validateQuery(PaginationDto),
  cohortController.getCohortPersons
);

export default router;
