import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

describe("ZodValidationPipe", () => {
  const pipe = new ZodValidationPipe(
    z.object({
      displayName: z.string().trim().min(1),
    }),
  );

  it("returns the schema's parsed and typed value", () => {
    expect(pipe.transform({ displayName: "  Chordially  " })).toEqual({
      displayName: "Chordially",
    });
  });

  it("returns a validation AppError with field details for invalid input", () => {
    try {
      pipe.transform({ displayName: "" });
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        details: [{ path: "displayName", message: expect.any(String) }],
      });
    }
  });
});
