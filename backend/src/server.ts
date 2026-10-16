import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { gamesRouter } from "./routes/games.routes.js";
import { bundlesRouter } from "./routes/bundles.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { isFirebaseConfigured } from "./config/firebase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/api/games", gamesRouter);
app.use("/api/bundles", bundlesRouter);
app.use("/api/auth", authRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    firebaseConnected: isFirebaseConfigured,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Pixel Store Backend running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - GET    /api/games`);
  console.log(`   - POST   /api/games`);
  console.log(`   - POST   /api/games/seed`);
  console.log(`   - POST   /api/auth/login`);
});
