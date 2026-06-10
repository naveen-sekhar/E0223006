import axios from "axios";

const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];

const BACKEND_ONLY_PACKAGES = [
  "cache", "controller", "cron_job", "domain",
  "handler", "repository", "route", "service"
];

const FRONTEND_ONLY_PACKAGES = [
  "api", "component", "hook", "page", "state", "style"
];

const SHARED_PACKAGES = ["auth", "config", "middleware", "utils"];

const VALID_PACKAGES = {
  backend: [...BACKEND_ONLY_PACKAGES, ...SHARED_PACKAGES],
  frontend: [...FRONTEND_ONLY_PACKAGES, ...SHARED_PACKAGES],
};

let _token = null;

// must be called before any Log() calls
export function initLogger(token) {
  _token = token;
}

function validateParams(stack, level, pkg, message) {
  if (!VALID_STACKS.includes(stack)) {
    return { valid: false, error: `Invalid stack "${stack}". Must be one of: ${VALID_STACKS.join(", ")}` };
  }
  if (!VALID_LEVELS.includes(level)) {
    return { valid: false, error: `Invalid level "${level}". Must be one of: ${VALID_LEVELS.join(", ")}` };
  }
  if (!VALID_PACKAGES[stack].includes(pkg)) {
    return { valid: false, error: `Invalid package "${pkg}" for stack "${stack}". Allowed: ${VALID_PACKAGES[stack].join(", ")}` };
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return { valid: false, error: "Message must be a non-empty string" };
  }
  return { valid: true };
}

// Log(stack, level, package, message) - sends log to the test server
export async function Log(stack, level, pkg, message) {
  const validation = validateParams(stack, level, pkg, message);
  if (!validation.valid) {
    console.error(`[LogMiddleware] Validation failed: ${validation.error}`);
    return null;
  }

  if (!_token) {
    console.error("[LogMiddleware] Token not initialized. Call initLogger(token) first.");
    return null;
  }

  // api has a 48 char limit on messages
  const truncatedMsg = message.length > 48 ? message.substring(0, 45) + "..." : message;

  try {
    const response = await axios.post(
      LOG_API_URL,
      {
        stack,
        level,
        package: pkg,
        message: truncatedMsg,
      },
      {
        headers: {
          Authorization: `Bearer ${_token}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message;
    console.error(`[LogMiddleware] Log failed: ${errMsg}`);
    return null;
  }
}

// express middleware - logs incoming requests and responses
export function requestLogger(req, res, next) {
  const start = Date.now();

  Log("backend", "info", "middleware", `→ ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    Log(
      "backend",
      level,
      "middleware",
      `← ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

export default Log;
