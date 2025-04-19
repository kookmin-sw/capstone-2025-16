import { Request, Response, NextFunction } from "express";
import * as pingService from "../services/ping.service";

export const ping = async (req: Request, res: Response, next: NextFunction) => {
  next(pingService.ping());
};
