import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { addBook, deleteBook, getallBooks } from "../controllers/bookcontrollers.js";
import express from "express";

const router = express.Router();

router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
router.get("/all", isAuthenticated, getallBooks);
router.delete("/delete/:id", isAuthenticated, isAuthorized("Admin"), deleteBook);

export default router;
