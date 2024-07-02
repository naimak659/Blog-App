import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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

app.get("/", (req, res) => {
  res.send("Hello, MERN Stack!");
});

import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";

app.use("/", userRouter);
app.use("/blog", blogRouter);

export { app };
