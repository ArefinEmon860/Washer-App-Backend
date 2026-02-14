import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import mongoose from "mongoose";
import router from "./mainroute/index.js";
import notFound from "./middleware/notFound.js";
import globalErrorHandler from "./middleware/globalErrorHandler.js";

const app = express();
app.set("trust proxy", true);
const server = createServer(app);

app.use(
  cors({
    credentials: true,
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use(express.json());

app.use(notFound);
app.use(globalErrorHandler);

app.use("/api", router);


app.get("/", (req, res) => {
  res.send("Server is running...!!");
});

const PORT = process.env.PORT || 5000;


server.listen(PORT, async () => {
  console.log(`Server is starting on port ${PORT}...`);

  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); 
}});
