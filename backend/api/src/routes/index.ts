import { Router } from "express";
import pingRoute from "./ping.route";

const router = Router();

router.use("/ping", pingRoute);

export default router;
