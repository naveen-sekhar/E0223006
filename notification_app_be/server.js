import express from "express";
import cors from "cors";
import { initLogger, Log, requestLogger } from "../logging_middleware/logger.js";
import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { authenticate } from "./services/auth.service.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let serverReady = false;

async function bootstrap() {
  try {
    const token = await authenticate();
    initLogger(token);
    app.use(requestLogger);

    await Log("backend", "info", "config", `Server bootstrapped, token acquired`);
    serverReady = true;
  } catch (error) {
    console.error("Bootstrap failed:", error.message);
  }
}

// block API requests until we have a token
app.use((req, res, next) => {
  if (req.path === "/health" || req.path.startsWith("/auth")) {
    return next();
  }
  if (!serverReady) {
    return res.status(503).json({
      success: false,
      message: "Server is still initializing. Please try again shortly.",
    });
  }
  next();
});

app.use("/auth", authRoutes);
app.use("/notifications", notificationRoutes);

app.get("/health", (_req, res) => {
  res.json({
    status: serverReady ? "ready" : "initializing",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, async () => {
  console.log(`\n🚀 Notification Backend running at http://localhost:${PORT}`);
  console.log("   GET  /notifications          — all notifications (paginated)");
  console.log("   GET  /notifications/priority  — top N priority notifications");
  console.log("   GET  /health                  — server status\n");
  await bootstrap();
});
