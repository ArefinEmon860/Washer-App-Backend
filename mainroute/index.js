import express from "express";

import userRoute from "../route/user.route.js";
import authRoute from "../route/auth.route.js";
import adminRoutes from "../route/admin.route.js";

const router = express.Router();

router.use("/user", userRoute);
router.use("/auth", authRoute);
router.use("/admin",adminRoutes);

export default router;