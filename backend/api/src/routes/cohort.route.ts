import { Router } from "express";
import {
  getCohorts,
  getCohortDetails,
  createNewCohort,
  updateExistingCohort,
  removeExistingCohort,
} from "../controllers/cohort.controller";
import { validateBody, validateParams } from "../validators/validator";
import {
  CreateCohortRequestDto,
  UpdateCohortRequestDto,
  CohortIdParamDto,
} from "../dtos/cohort.dto";

const router = Router();

// GET /cohort - 코호트 리스트 출력
router.get("/", getCohorts);

// GET /cohort/:cohortId - 특정 코호트 person_id 리스트 출력
router.get("/:cohortId", validateParams(CohortIdParamDto), getCohortDetails);

// POST /cohort - 코호트 생성
router.post("/", validateBody(CreateCohortRequestDto), createNewCohort);

// PUT /cohort/:cohortId - 코호트 수정
router.put(
  "/:cohortId",
  validateParams(CohortIdParamDto),
  validateBody(UpdateCohortRequestDto),
  updateExistingCohort
);

// DELETE /cohort/:cohortId - 코호트 삭제
router.delete(
  "/:cohortId",
  validateParams(CohortIdParamDto),
  removeExistingCohort
);

export default router;
