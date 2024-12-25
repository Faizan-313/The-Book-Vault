import express from "express";
import { loginUser, registerUser } from "../controller/authController.js";

const router = express.Router();

// Placeholder for authentication logic
router.post('/login', loginUser);

router.post('/register', registerUser);

export default router;