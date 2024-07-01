import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middlewares/Auth.js";
import { Blog } from "../models/blog.model.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const createBlog = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { text, title } = req.body;

  const newBlog = await Blog.create({
    text,
    title,
    author: user._id,
  });

  const blog = await Blog.findById(newBlog._id);
  console.log(newBlog);

  res.status(200).json({ user, newBlog });
});

const getAllBlogs = asyncHandler(async (req, res) => {
  const user = req.user._id;

  const blogs = await Blog.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorDetails",
      },
    },
    {
      $unwind: "$authorDetails",
    },
    {
      $project: {
        id: 1,
        title: 1,
        text: 1,
        createdAt: 1,
        updatedAt: 1,
        author: {
          _id: "$authorDetails._id",
          name: "$authorDetails.name",
          email: "$authorDetails.email",
          fullname: "$authorDetails.fullname",
        },
      },
    },
  ]);

  res.status(200).json({ user, blogs });
});

export { getAllBlogs, createBlog };
