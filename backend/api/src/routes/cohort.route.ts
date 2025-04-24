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

/**
 * @swagger
 * tags:
 *  name: Cohort
 *  description: 코호트 관리 API
 */

/**
 * @swagger
 * /api/cohort:
 *   get:
 *     summary: 코호트 리스트 출력
 *     tags: [Cohort]
 *     parameters:
 *       - $ref: '#/components/parameters/Pagination'
 *     responses:
 *       200:
 *         description: 코호트 리스트 출력 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cohort'
 *             examples:
 *               cohortList:
 *                 value:
 *                   - cohort_id: "01964bfb-3e19-7e1f-8556-70b532a23327"
 *                     name: "테스트22"
 *                     description: "테스트"
 *                     cohort_definition: "{\"conceptsets\":[],\"initialGroup\":{\"containers\":[{\"name\":\"Condition Era\",\"filters\":[{\"type\":\"measurement\",\"first\":true}]}]},\"comparisonGroup\":{\"containers\":[{\"name\":\"Male\",\"filters\":[{\"type\":\"demographic\",\"gender\":\"8507\"}]},{\"name\":\"Female\",\"filters\":[{\"type\":\"demographic\",\"gender\":\"8532\"}],\"operator\":\"AND\"}]}}"
 *                     author: "00000000-0000-0000-0000-000000000000"
 *                     created_at: "2025-04-19 02:57:58.809"
 *                     updated_at: "2025-04-19 02:57:58.811"
 */
router.get("/", validateQuery(PaginationDto), cohortController.getCohorts);

/**
 * @swagger
 * /api/cohort:
 *   post:
 *     summary: 코호트 생성
 *     tags: [Cohort]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCohortRequest'
 *           examples:
 *             cohortCreate:
 *               value:
 *                 name: "테스트 코호트"
 *                 description: "테스트 설명"
 *                 cohortDefinition:
 *                   conceptsets: []
 *                   initialGroup:
 *                     containers:
 *                       - name: "Condition Era"
 *                         filters:
 *                           - type: "measurement"
 *                             first: true
 *     responses:
 *       201:
 *         description: 코호트 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cohort'
 *             examples:
 *               cohortCreated:
 *                 value:
 *                   message: "Cohort created successfully"
 *                   cohortId: "01964bfb-3e19-7e1f-8556-70b532a23327"
 *                   containerCounts:
 *                     - 10000
 *                     - 1000
 */
router.post(
  "/",
  validateBody(CreateCohortRequestDto),
  cohortController.createNewCohort
);

/**
 * @swagger
 * /api/cohort/{cohortId}:
 *   get:
 *     summary: 특정 코호트 정보 출력
 *     tags: [Cohort]
 *     parameters:
 *       - $ref: '#/components/parameters/CohortId'
 *     responses:
 *       200:
 *         description: 코호트 정보 출력 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cohort'
 *             examples:
 *               cohortItem:
 *                 value:
 *                   cohort_id: "01964bfb-3e19-7e1f-8556-70b532a23327"
 *                   name: "테스트22"
 *                   description: "테스트"
 *                   cohort_definition: "{\"conceptsets\":[],\"initialGroup\":{\"containers\":[{\"name\":\"Condition Era\",\"filters\":[{\"type\":\"measurement\",\"first\":true}]}]},\"comparisonGroup\":{\"containers\":[{\"name\":\"Male\",\"filters\":[{\"type\":\"demographic\",\"gender\":\"8507\"}]},{\"name\":\"Female\",\"filters\":[{\"type\":\"demographic\",\"gender\":\"8532\"}],\"operator\":\"AND\"}]}}"
 *                   author: "00000000-0000-0000-0000-000000000000"
 *                   created_at: "2025-04-19 02:57:58.809"
 *                   updated_at: "2025-04-19 02:57:58.811"
 *       404:
 *         description: 코호트를 찾을 수 없음
 */
router.get(
  "/:cohortId",
  validateParams(CohortIdParamDto),
  cohortController.getCohort
);

/**
 * @swagger
 * /api/cohort/{cohortId}:
 *   put:
 *     summary: 코호트 수정
 *     tags: [Cohort]
 *     parameters:
 *       - $ref: '#/components/parameters/CohortId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCohortRequest'
 *           examples:
 *             cohortUpdate:
 *               value:
 *                 name: "수정된 코호트 이름"
 *                 description: "수정된 설명"
 *     responses:
 *       200:
 *         description: 코호트 수정 성공
 *         content:
 *           application/json:
 *             examples:
 *               cohortUpdated:
 *                 value:
 *                   message: "Cohort updated successfully"
 *       404:
 *         description: 코호트를 찾을 수 없음
 */
router.put(
  "/:cohortId",
  validateParams(CohortIdParamDto),
  validateBody(UpdateCohortRequestDto),
  cohortController.updateExistingCohort
);

/**
 * @swagger
 * /api/cohort/{cohortId}:
 *   delete:
 *     summary: 코호트 삭제
 *     tags: [Cohort]
 *     parameters:
 *       - $ref: '#/components/parameters/CohortId'
 *     responses:
 *       200:
 *         description: 코호트 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cohort deleted successfully"
 *       404:
 *         description: 코호트를 찾을 수 없음
 */
router.delete(
  "/:cohortId",
  validateParams(CohortIdParamDto),
  cohortController.removeExistingCohort
);

/**
 * @swagger
 * /api/cohort/{cohortId}/statistics:
 *   get:
 *     summary: 특정 코호트 통계 정보 출력
 *     tags: [Cohort]
 *     parameters:
 *       - $ref: '#/components/parameters/CohortId'
 *     responses:
 *       200:
 *         description: 코호트 통계 정보 출력 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gender:
 *                   type: array
 *                   description: 성별 분포
 *                   items:
 *                     type: object
 *                     properties:
 *                       concept_id:
 *                         type: number
 *                         description: 성별 개념 ID
 *                       concept_name:
 *                         type: string
 *                         description: 성별 명칭
 *                       count:
 *                         type: number
 *                         description: 환자 수
 *                 mortality:
 *                   type: object
 *                   description: 생존/사망 분포
 *                   properties:
 *                     alive:
 *                       type: number
 *                       description: 생존 환자 수
 *                     deceased:
 *                       type: number
 *                       description: 사망 환자 수
 *                 age:
 *                   type: array
 *                   description: 연령대별 분포
 *                   items:
 *                     type: object
 *                     properties:
 *                       age_start:
 *                         type: number
 *                         description: 연령대 시작 값
 *                       age_end:
 *                         type: number
 *                         description: 연령대 종료 값
 *                       count:
 *                         type: number
 *                         description: 환자 수
 *             examples:
 *               statisticsExample:
 *                 value:
 *                   gender:
 *                     - concept_id: 8507
 *                       concept_name: "MALE"
 *                       count: 80
 *                     - concept_id: 8532
 *                       concept_name: "FEMALE"
 *                       count: 70
 *                   mortality:
 *                     alive: 140
 *                     deceased: 10
 *                   age:
 *                     - age_start: 0
 *                       age_end: 9
 *                       count: 10
 *                     - age_start: 10
 *                       age_end: 19
 *                       count: 15
 *                     - age_start: 20
 *                       age_end: 29
 *                       count: 25
 *       404:
 *         description: 코호트를 찾을 수 없음
 */
router.get(
  "/:cohortId/statistics",
  validateParams(CohortIdParamDto),
  cohortController.getCohortStatistics
);

/**
 * @swagger
 * /api/cohort/{cohortId}/persons:
 *   get:
 *     summary: 특정 코호트 person ID 리스트 출력
 *     tags: [Cohort]
 *     parameters:
 *       - $ref: '#/components/parameters/CohortId'
 *       - $ref: '#/components/parameters/Pagination'
 *     responses:
 *       200:
 *         description: 코호트 person ID 리스트 출력 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 description: 환자 ID
 *             examples:
 *               personsExample:
 *                 value: ["12345", "67890", "54321"]
 *       404:
 *         description: 코호트를 찾을 수 없음
 */
router.get(
  "/:cohortId/persons",
  validateParams(CohortIdParamDto),
  validateQuery(PaginationDto),
  cohortController.getCohortPersons
);

export default router;
