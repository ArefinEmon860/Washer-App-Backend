import express from "express";
import {
    getAllWashers,
  goOnline,
  goOffline,
  acceptBooking,
  completeWash,
  getWasherStatus
} from "../controller/washer.controller.js";
import {
  protect
} from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/", getAllWashers);
router.get("/status", protect, getWasherStatus);
router.post("/online", protect, goOnline);
router.post("/offline", protect, goOffline);
router.post("/accept/:bookingId", protect, acceptBooking);
router.post("/complete/:bookingId", protect, completeWash);

export default router;
