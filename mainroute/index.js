import express from "express";

import userRoute from "../route/user.route.js";

const router = express.Router();

router.use("/user", userRoute);

export default router;