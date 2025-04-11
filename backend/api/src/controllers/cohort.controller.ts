import { Request, Response, NextFunction } from "express";
import {
  getAllCohorts,
  getCohortById,
  createCohort,
  updateCohort,
  deleteCohort,
} from "../services/cohort.service";
import {
  CreateCohortRequestDto,
  UpdateCohortRequestDto,
  CohortIdParamDto,
} from "../dtos/cohort.dto";

export const getCohorts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(await getAllCohorts());
};

export const getCohort = async (
  req: Request<CohortIdParamDto>,
  res: Response,
  next: NextFunction
) => {
  const { cohortId } = req.params;
  next(await getCohortById(cohortId));
};

export const createNewCohort = async (
  req: Request<{}, {}, CreateCohortRequestDto>,
  res: Response,
  next: NextFunction
) => {
  const { name, description, cohortDefinition, temporary } = req.body;
  next(
    await createCohort(
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
    await updateCohort(cohortId, name, description, cohortDefinition as any)
  );
};

export const removeExistingCohort = async (
  req: Request<CohortIdParamDto>,
  res: Response,
  next: NextFunction
) => {
  const { cohortId } = req.params;
  next(await deleteCohort(cohortId));
};
