import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.js";
import {
  createBlog,
  userBlogs,
  getAllBlogs,
} from "../controller/blog.controller.js";

const router = Router();

router.route("/api/blogs").post(verifyJWT, getAllBlogs);
router.route("/api/post").post(verifyJWT, createBlog);
router.route("/api/user/:id").post(verifyJWT, userBlogs);

export default router;
