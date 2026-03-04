import express from "express";
import cors from "cors";
import analyzeRouter from "./routes/analyze.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "Server running" });
});

app.use("/api/analyze", analyzeRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});