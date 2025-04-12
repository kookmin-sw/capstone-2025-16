import { Router } from "express";
import { ping } from "../controllers/ping.controller";

const router = Router();

router.get("/", ping);

export default router;
