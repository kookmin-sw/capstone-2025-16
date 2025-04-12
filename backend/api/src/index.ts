import "reflect-metadata";
import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { handleResponse } from "./helpers/response.helper";
import addCustomAsyncErrorHandler from "./helpers/exception.helper";

// 비동기 예외 처리 핸들러 추가
addCustomAsyncErrorHandler();

const app = express();

// JSON 파서 미들웨어 등록
app.use(express.json());

// CORS 설정
app.use(cors());

// 라우터 등록
app.use("/api", routes);

// 응답 핸들러 등록 (에러 미들웨어)
app.use(handleResponse);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
