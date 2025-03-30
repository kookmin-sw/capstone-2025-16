import { Request, Response } from "express";
import { getPingMessage } from "../services/pingService";

export const ping = async (req: Request, res: Response) => {
  const result = getPingMessage();
  res.status(200).json(result);
};
