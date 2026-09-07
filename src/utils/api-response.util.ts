import { Response } from "express";
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from "sequelize";

export class ApiError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "ApiError";
  }
}

export function respondError(res: Response, error: unknown) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (error instanceof UniqueConstraintError || error instanceof ForeignKeyConstraintError) {
    return res.status(409).json({ success: false, message: "Data conflicts with an existing or related record" });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }
  console.error("API request failed", error);
  return res.status(500).json({ success: false, message: "Internal server error" });
}

export async function respond(res: Response, action: () => Promise<unknown>, status = 200) {
  try {
    const data = await action();
    return res.status(status).json({ success: true, data });
  } catch (error: unknown) {
    return respondError(res, error);
  }
}
