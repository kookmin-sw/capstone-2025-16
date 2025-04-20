import { HttpResponse } from "../helpers/response.helper";

export const ping = () => {
  return new HttpResponse(200, "pong");
};
