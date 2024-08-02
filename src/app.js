import express, { json } from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
// import { ApiError } from "./utils/ApiError.js";
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.static("public/dist"));
// app.use(express.static(path.join(__dirname, "public/dist")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
// app.use(express.static(path.join(__dirname, "public")));
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

app.use("/", userRouter);
app.use("/blog", blogRouter);

app.get("/", (req, res) => {
  res.send("Hello, MERN Stack!");
  // res.sendFile(path.join(__dirname, "../public/dist", "index.html"));
});

export { app };
