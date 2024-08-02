import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const createBlog = asyncHandler(async (req, res) => {
  const user = req.user;
  // const user = await User.findById(req.user._id);
  const { text, title, isPublic } = req.body;

  const coverImagepath = req.files?.coverImage[0]?.path;

  if (!coverImagepath) {
    throw new ApiError(400, "cover image is required");
  }
  const coverImage = await uploadOnCloudinary(coverImagepath);

  console.log(coverImage);

  const newBlog = await Blog.create({
    text,
    title,
    isPublic,
    author: user._id,
    coverImage: coverImage.url,
  });

  const blog = await Blog.findById(newBlog._id);
  console.log(newBlog);

  res
    .status(200)
    .json(new ApiResponse(200, newBlog, "Blog created Successfully"));
});

const getAllBlogs = asyncHandler(async (req, res) => {
  const blogsData = await Blog.aggregate([
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
          username: "$authorDetails.username",
          fullname: "$authorDetails.fullname",
        },
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, blogsData, "Blogs fetch successfull"));
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
        // text: 1,
        coverImage: 1,
        createdAt: 1,
        // updatedAt: 1,
        author: {
          _id: "$authorDetails._id",
          name: "$authorDetails.name",
          email: "$authorDetails.email",
          fullname: "$authorDetails.fullname",
          userPhoto: "$authorDetails.userPhoto",
          username: "$authorDetails.username",
        },
      },
    },
  ]);

  if (!currentUserBlogs) {
    throw new ApiError(400, "user blog not found");
  }

  res
    .status(200)
    .json(new ApiResponse(201, currentUserBlogs, "user blog found"));
});

const updateBlog = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const blogParam = req.params.id;

  console.log(blogParam);
  if (!mongoose.Types.ObjectId.isValid(blogParam)) {
    res.status(400).json(new ApiResponse(400, null, "Invalid Blog ID"));
    return;
  }
  const id = new mongoose.Types.ObjectId(blogParam);
  let { title, text, coverImage } = req.body;
  let coverImgPath;

  console.log(title, text, coverImage, coverImgPath);

  console.log(blogParam);

  if (req.file) {
    // Single file upload scenario
    coverImgPath = req.file.path;
  } else if (req.files && req.files.coverImage) {
    // Multiple files upload scenario
    coverImgPath = req.files.coverImage[0].path; // Assuming you only want the first file
  }

  if (coverImgPath) {
    let updatedImg = await uploadOnCloudinary(coverImgPath);
    coverImage = updatedImg.url;
  }

  // console.log("coverImgPath", coverImgPath);
  // console.log("coverImage", coverImage);

  const blog = await Blog.findByIdAndUpdate(
    blogParam,
    {
      $set: {
        title,
        text,
        coverImage,
      },
    },
    { new: true }
  );

  console.log(blog);

  if (!blog) {
    res
      .status(400)
      .json(new ApiResponse(400, null, "Blog not found and not updated"));
  }

  res.status(200).json(new ApiResponse(200, blog, "Blog updated successfully"));
});

const viewBlogById = asyncHandler(async (req, res) => {
  console.log("\n view blog by id \n");
  const blogId = req.params.id;
  const id = new mongoose.Types.ObjectId(blogId);

  // Ensure blogId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    res.status(400).json(new ApiResponse(400, null, "Invalid Blog ID"));
    return;
  }
  // console.log(id);
  // const blog = await Blog.findById(blogId);
  const blog = await Blog.aggregate([
    {
      $match: { _id: id },
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
          userPhoto: "$authorDetails.userPhoto",
          username: "$authorDetails.username",
        },
      },
    },
  ]);
  // console.log(blog);
  // console.log("blog", blog);

  if (!blog || blog.length === 0) {
    res.status(400).json(new ApiResponse(400, null, "Blog not found"));
    return;
  }

  res
    .status(200)
    .json(new ApiResponse(200, blog[0], "Blog fetched successfully"));
});

export { getAllBlogs, createBlog, userBlogs, updateBlog, viewBlogById };
