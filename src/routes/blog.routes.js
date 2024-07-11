import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.js";
import {
  createBlog,
  userBlogs,
  getAllBlogs,
} from "../controller/blog.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/api/blogs").post(verifyJWT, getAllBlogs);
router
  .route("/api/post")
  .post(
    upload.fields([{ maxCount: 1, name: "coverImage" }]),
    verifyJWT,
    createBlog
  );
router.route("/api/user/:id").post(verifyJWT, userBlogs);
router
  .route("/api/updateBlog/:id")
  .post(
    verifyJWT,
    upload.fields([{ maxCount: 1, name: "coverImage" }]),
    userBlogs
  );

export default router;
