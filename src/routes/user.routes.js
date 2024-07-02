import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  userLogin,
  verifyTheUser,
  changeCurrentPassword,
  getCurrentUser,
  refreshAccessToken,
  updateAccountDetails,
  userLogOut,
} from "../controller/user.controller.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      maxCount: 1,
      name: "userPhoto"
    },
  ]),
  registerUser
);
router.route("/verification").post(verifyJWT, verifyTheUser);
router.route("/login").post(userLogin);
router.route("/logout").post(verifyJWT, userLogOut);
router.route("/chagePassword").post(verifyJWT, changeCurrentPassword);
router.route("/user").get(verifyJWT, getCurrentUser);
router.route("/update").post(verifyJWT, updateAccountDetails);
router.route("/refresh").post(verifyJWT, refreshAccessToken);

export default router;
