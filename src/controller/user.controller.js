import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import nodermailer from "nodemailer";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { sendVerificationEmail } from "../utils/verification.js";

const generateAccessAndRfreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "something went wrong while generating refresh token"
    );
  }
};

// const transporter = nodermailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.MAILER_USER,
//     pass: process.env.MAILER_PASS,
//   },

// });

// let mailOptions = {
//   from: process.env.MAILER_USER,
//   to: "",   // The recipient's email address
//   subject: 'Blog-AK Email Verification',
//   text: `Click the link to verify your email: `,
//   html: '<p>Click the link to verify your email: <a href="http://example.com/verify?token=uniqueToken">Verify Email</a></p>'
// };

const registerUser = asyncHandler(async (req, res) => {
  //
  const { fullname, email, username, password } = req.body;

  if (!fullname || !email || !username || !password) {
    throw new ApiError(400, "all fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "user with the email or username already exists");
  }

  const user = await User.create({
    fullname,
    email,
    username: username.toLowerCase(),
    password,
  });

  const { accessToken, refreshToken } = await generateAccessAndRfreshToken(
    user._id
  );

  const sendEmail = await sendVerificationEmail(user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -verificationCode -verificationTokenExpires"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, createdUser, "user register successfully"));
});

const verifyTheUser = asyncHandler(async (req, res) => {
  /*
   ** 1.req for the code and cookies
   ** 2. search by user or email name in db
   ** 3. if not found return false
   ** 4. if found check the code and time
   ** 5. date.now() - user.expire <= 0 than verified the user true or return expired the time
   ** 6.
   ** 7.
   */

  const { _id } = req.user;
  const code = req.body.code;
  if (!code) {
    throw new ApiError(401, "account or code doesn't found");
  }
  let verified;

  const user = await User.findById(_id);

  const serverCode = user.verificationCode;
  const expiryTime = user.verificationTokenExpires;

  if (code != serverCode) {
    throw new ApiError(400, "Code doen't matched, Try again");
  }
  const checkExpiryTime = Date.now() - expiryTime;
  if (checkExpiryTime > 0) {
    throw new ApiError(400, "Time Expired Try again");
  }

  const updateVarificationInDB = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    },
    { new: true }
  ).select(
    "-password -refreshToken -verificationCode -verificationTokenExpires"
  );

  return res.json(
    new ApiResponse(202, updateVarificationInDB, "Email Verified Successfully")
  );
});

const userLogin = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "username or email and password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRfreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -verificationCode -verificationTokenExpires"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const userLogOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRfreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    console.log("error in refreshtoke");
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select(
    "-password -refreshToken -verificationCode -verificationTokenExpires"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

export {
  registerUser,
  verifyTheUser,
  userLogin,
  userLogOut,
  updateAccountDetails,
  getCurrentUser,
  changeCurrentPassword,
  refreshAccessToken,
};
