import { expect, test } from "@playwright/test";
import { app } from "../src/app";

test("serves the health endpoint", async () => {
  const response = await app.request("/health");

  expect(response.ok).toBe(true);
  await expect(response.json()).resolves.toEqual({
    status: "ok",
  });
});
