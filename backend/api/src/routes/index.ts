import { Router } from "express";
import pingRoutes from "./pingRoutes";

const router = Router();

router.use("/api", pingRoutes);

export default router;
