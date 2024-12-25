import express from "express";
import { editBook,deleteBook } from "../controller/editController.js"; 

const router = express.Router();

router.post('/editBook', editBook);
router.post('/deleteBook', deleteBook);

export default router;