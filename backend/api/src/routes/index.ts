import { Router } from "express";
import pingRoute from "./ping.route";
import cohortRoute from "./cohort.route";

const router = Router();

router.use("/ping", pingRoute);
router.use("/cohort", cohortRoute);

export default router;
