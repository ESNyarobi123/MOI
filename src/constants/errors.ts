export const ERROR_MESSAGES = {
  BAD_REQUEST: "Invalid request payload.",
  UNAUTHORIZED: "Authentication required.",
  FORBIDDEN: "You are not allowed to perform this action.",
  NOT_FOUND: "Requested resource was not found.",
  CONFLICT: "Resource state conflicts with this request.",
  UNPROCESSABLE_ENTITY: "Request cannot be processed.",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
  SERVICE_UNAVAILABLE:
    "Database is not available. Set DATABASE_URL in .env.local to your Neon Postgres connection string (see .env.example).",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again."
} as const;
