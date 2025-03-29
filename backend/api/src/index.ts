import express from "express";
import routes from './routes';

const app = express();

// JSON 파서 미들웨어 등록
app.use(express.json());

// 라우터 등록
app.use(routes);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});