import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

export class HttpResponse {
  status: number;
  data: string | object;

  constructor(status: number, data: string | object) {
    this.status = status;
    this.data = data;
  }
}

export const handleResponse: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  if (err instanceof HttpResponse) {
    res.status(err.status);
    if (typeof err.data === "string") {
      return res.send(err.data);
    }
    return res.json(err.data);
  }

  console.error(err);
  res.status(500).send("Internal Server Error");
};
