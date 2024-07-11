import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createBlog = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { text, title } = req.body;

  const coverImagepath = req.files?.coverImage[0]?.path;

  console.log("coverImagepath", coverImagepath);

  if (!coverImagepath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const coverImage = await uploadOnCloudinary(coverImagepath);

  const newBlog = await Blog.create({
    text,
    title,
    author: user._id,
    coverImage: coverImage.url,
  });

  const blog = await Blog.findById(newBlog._id);
  console.log(newBlog);

  res.status(200).json({ newBlog });
});

const getAllBlogs = asyncHandler(async (req, res) => {
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
        coverImage: 1,
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

  res.status(200).json({ blogs });
});

const userBlogs = asyncHandler(async (req, res) => {
  const userName = req.params.id;
  console.log("userName", userName);
  if (!userName) {
    throw new ApiError(400, "username required");
  }

  const user = await User.findOne({ username: userName });

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const currentUserBlogs = await Blog.aggregate([
    {
      $match: { author: user._id },
    },
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
        coverImage: 1,
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

  if (!currentUserBlogs) {
    throw new ApiError(400, "user blog not found");
  }

  res.status(200).json(new ApiResponse(201, currentUserBlogs));
});

const updateBlog = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const blogParam = req.params.id;
  const { title, text } = req.body;
  const coverImgPath = req.file?.coverImage[0]?.path;

  

});

export { getAllBlogs, createBlog, userBlogs };
