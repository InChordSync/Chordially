import "dotenv/config";
import express from "express";

const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
