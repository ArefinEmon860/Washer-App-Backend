import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";

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

app.get("/", (req, res) => {
  res.send("Server is running...!!");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});
