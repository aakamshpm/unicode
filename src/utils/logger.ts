import pino from "pino";
import { config } from "../config/env.js";

const isProduction = config.NODE_ENV === "production";

export const logger = pino({
  level: "info",
  transport: isProduction
    ? undefined // JSON output for production
    : {
        target: "pino-pretty",
        options: { colorize: true },
      },
});
