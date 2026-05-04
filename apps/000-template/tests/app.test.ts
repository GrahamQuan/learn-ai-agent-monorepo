import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("api app", () => {
  it("returns health status", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
    });
  });
});
