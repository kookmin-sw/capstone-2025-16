import { Request, Response, NextFunction } from "express";
import * as cohortService from "../services/cohort.service";
import {
  CreateCohortRequestDto,
  UpdateCohortRequestDto,
  CohortIdParamDto,
} from "../dtos/cohort.dto";
import { PaginationDto } from "../dtos/common.dto";

export const getCohorts = async (
  req: Request<{}, {}, {}, PaginationDto>,
  res: Response,
  next: NextFunction
) => {
  const { page } = req.query;
  next(await cohortService.getCohorts(page ?? 0));
};

export const getCohortStatistics = async (
  req: Request<CohortIdParamDto>,
  res: Response,
  next: NextFunction
) => {
  const { cohortId } = req.params;
  next(await cohortService.getCohortStatistics(cohortId));
};

export const getCohort = async (
  req: Request<CohortIdParamDto>,
  res: Response,
  next: NextFunction
) => {
  const { cohortId } = req.params;
  next(await cohortService.getCohort(cohortId));
};

export const getCohortPersons = async (
  req: Request<CohortIdParamDto, {}, {}, PaginationDto>,
  res: Response,
  next: NextFunction
) => {
  const { cohortId } = req.params;
  const { page } = req.query;
  next(await cohortService.getCohortPersons(cohortId, page ?? 0));
};

export const createNewCohort = async (
  req: Request<{}, {}, CreateCohortRequestDto>,
  res: Response,
  next: NextFunction
) => {
  const { name, description, cohortDefinition, temporary } = req.body;
  next(
    await cohortService.createNewCohort(
      name,
      description,
      cohortDefinition as any, // TODO: fix type
      temporary
    )
  );
};

export const updateExistingCohort = async (
  req: Request<CohortIdParamDto, {}, UpdateCohortRequestDto>,
  res: Response,
  next: NextFunction
) => {
  const { cohortId } = req.params;
  const { name, description, cohortDefinition } = req.body;
  next(
    await cohortService.updateExistingCohort(
      cohortId,
      name,
      description,
      cohortDefinition as any
    )
  );
};

export const removeExistingCohort = async (
  req: Request<CohortIdParamDto>,
  res: Response,
  next: NextFunction
) => {
  const { cohortId } = req.params;
  next(await cohortService.removeExistingCohort(cohortId));
};
