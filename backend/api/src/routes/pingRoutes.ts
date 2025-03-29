import { Router } from "express";
import { ping } from "../controllers/pingController";

const router = Router();

router.get("/ping", ping);

export default router;
