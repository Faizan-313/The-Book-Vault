import { logoutUser } from "../controller/logoutController.js";
import express from "express";

const router = express.Router();

router.get("/",logoutUser);

export default router;