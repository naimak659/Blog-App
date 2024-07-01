import dotenv from "dotenv";
import connectDB from "./DB/connectMongo.js";
import { app } from "./app.js";

dotenv.config();


connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("mogo db connection failed!!!", err);
  });
