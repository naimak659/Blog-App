import mongoose, { Schema } from "mongoose";

const userBlogSchema = new Schema({
  blogId: String,
  creator: string,
});

const userBlog = mongoose.model("userBlog", userBlogSchema);
