import { Router } from "express";
import * as pingController from "../controllers/ping.controller";

const router = Router();

router.get("/", pingController.ping);

export default router;
