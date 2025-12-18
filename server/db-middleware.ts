import { db } from "../database/drizzle/db";
import { enhance, type UniversalMiddleware } from "@universal-middleware/core";

declare global {
  namespace Universal {
    interface Context {
      db: typeof db;
    }
  }
}

// Add `db` to the Context
export const dbMiddleware: UniversalMiddleware = enhance(
  async (_request, context, _runtime) => {
    return {
      ...context,
      db: db,
    };
  },
  {
    name: "my-app:db-middleware",
    immutable: false,
  },
);
