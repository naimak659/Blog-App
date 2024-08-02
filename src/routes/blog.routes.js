import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.js";
import {
  createBlog,
  userBlogs,
  getAllBlogs,
  viewBlogById,
  updateBlog,
} from "../controller/blog.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/api/blogs").get(getAllBlogs);
router
  .route("/api/post")
  .post(
    upload.fields([{ maxCount: 1, name: "coverImage" }]),
    verifyJWT,
    createBlog
  );
router.route("/api/blog/:id").get(viewBlogById);
router.route("/api/user/:id").get(userBlogs);
router
  .route("/api/updateBlog/:id")
  .put(
    verifyJWT,
    upload.fields([{ maxCount: 1, name: "coverImage" }]),
    updateBlog
  );

export default router;
