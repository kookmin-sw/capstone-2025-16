import { HttpResponse } from "../helpers/response.helper";

export const getPingMessage = () => {
  return new HttpResponse(200, "pong");
};
