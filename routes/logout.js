import { logoutUser } from "../controller/logoutController.js";
import express from "express";

const router = express.Router();

router.get("/logoutUser",logoutUser);

export default router;