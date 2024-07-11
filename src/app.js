import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
// app.use((err, req, res, next) => {
//   if (err instanceof ApiError) {
//     return res.status(err.statusCode).json({
//       success: err.success,
//       message: err.message,
//       errors: err.errors,
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message: "Internal Server Error",
//   });
// });

app.get("/", (req, res) => {
  res.send("Hello, MERN Stack!");
});

app.use("/", userRouter);
app.use("/blog", blogRouter);

export { app };
