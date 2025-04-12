import { Request, Response, NextFunction } from "express";
import { getPingMessage } from "../services/ping.service";

export const ping = async (req: Request, res: Response, next: NextFunction) => {
  next(getPingMessage());
};
