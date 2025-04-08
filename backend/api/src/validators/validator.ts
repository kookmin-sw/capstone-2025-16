import { validateOrReject } from "class-validator";
import { plainToClass } from "class-transformer";
import { NextFunction, Request, Response } from "express";

const validateBody = (schema: { new (): any }) => {
  return async (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let body = plainToClass(schema, req.body);
      await validateOrReject(body, {
        forbidUnknownValues: true,
      });
      req.body = body;
      next();
    } catch (err) {
      res.status(400).json({ error: "Invalid request body", details: err });
    }
  };
};

const validateQuery = (schema: { new (): any }) => {
  return async (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let query = plainToClass(schema, req.query);
      await validateOrReject(query, {
        forbidUnknownValues: true,
      });
      req.query = query;
      next();
    } catch (err) {
      res.status(400).json({ error: "Invalid query parameters", details: err });
    }
  };
};

const validateParams = (schema: { new (): any }) => {
  return async (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let params = plainToClass(schema, req.params);
      await validateOrReject(params, {
        forbidUnknownValues: true,
      });
      req.params = params;
      next();
    } catch (err) {
      res.status(400).json({ error: "Invalid path parameters", details: err });
    }
  };
};

export { validateBody, validateQuery, validateParams };
