import { PGlite } from "@electric-sql/pglite";
import { user } from "@trove/db/schema/auth";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Mailer } from "./mailer";

// SAFETY: the PGlite Drizzle instance is intentionally passed through the mocked createDb seam.
const mocks = vi.hoisted(() => ({ db: undefined as unknown }));

// oxlint-disable-next-line anti-slop/no-module-mocking -- createAuth reads the Cloudflare-bound database through this module seam; PGlite still exercises real Better Auth endpoints.
vi.mock("@trove/db", () => ({
  createDb: () => mocks.db,
}));

// oxlint-disable-next-line anti-slop/no-module-mocking -- provide deterministic non-secret Worker config for the real auth handler.
vi.mock("@trove/env/server", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-for-better-auth",
    BETTER_AUTH_URL: "http://auth.test",
    CORS_ORIGIN: "https://auth.test",
  },
}));

describe("Better Auth password HTTP flow", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;

  beforeEach(async () => {
    client = new PGlite();
    await client.exec(`
      CREATE TABLE "user" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "email_verified" boolean DEFAULT false NOT NULL,
        "image" text,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "updated_at" timestamptz DEFAULT now() NOT NULL
      );
      CREATE TABLE "session" (
        "id" text PRIMARY KEY NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "token" text NOT NULL UNIQUE,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "updated_at" timestamptz NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
      );
      CREATE TABLE "account" (
        "id" text PRIMARY KEY NOT NULL,
        "account_id" text NOT NULL,
        "provider_id" text NOT NULL,
        "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
        "access_token" text,
        "refresh_token" text,
        "id_token" text,
        "access_token_expires_at" timestamptz,
        "refresh_token_expires_at" timestamptz,
        "scope" text,
        "password" text,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
      CREATE TABLE "verification" (
        "id" text PRIMARY KEY NOT NULL,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "updated_at" timestamptz DEFAULT now() NOT NULL
      );
    `);
    db = drizzle({ client });
    mocks.db = db;
  });

  afterEach(async () => {
    await client.close();
  });

  it("allows native password signup and signin through the auth handler", async () => {
    const { createAuth } = await import("./index");
    const auth = createAuth({ mailer: { send: vi.fn() } });
    const email = "native-auth@example.com";

    const signup = await auth.handler(
      new Request("http://auth.test/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email, name: "Native Auth", password: "correct-password" }),
      }),
    );

    expect(signup.status).toBe(200);
    expect(await signup.json()).toMatchObject({ user: { email, name: "Native Auth" } });

    const signin = await auth.handler(
      new Request("http://auth.test/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email, password: "correct-password" }),
      }),
    );

    expect(signin.status).toBe(200);
    expect(await signin.json()).toMatchObject({ user: { email, name: "Native Auth" } });

    const cookie = signin.headers.get("set-cookie")?.split(";", 1)[0];
    expect(cookie).toMatch(/session_token=/);

    const restored = await auth.handler(
      new Request("http://auth.test/api/auth/get-session", {
        headers: { cookie: cookie ?? "" },
      }),
    );

    expect(restored.status).toBe(200);
    expect(await restored.json()).toMatchObject({ user: { email, name: "Native Auth" } });

    const invalidSignin = await auth.handler(
      new Request("http://auth.test/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email, password: "wrong-password" }),
      }),
    );

    expect(invalidSignin.status).toBe(401);
    expect(await invalidSignin.json()).toMatchObject({ code: "INVALID_EMAIL_OR_PASSWORD" });
  });

  it("sends magic-link and reset messages for an existing password user", async () => {
    const { createAuth } = await import("./index");
    const send = vi.fn(async () => undefined);
    const auth = createAuth({ mailer: { send } });
    const email = "existing-auth@example.com";

    const signup = await auth.handler(
      new Request("http://auth.test/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email, name: "Existing Auth", password: "correct-password" }),
      }),
    );
    expect(signup.status).toBe(200);

    const magic = await auth.handler(
      new Request("http://auth.test/api/auth/sign-in/magic-link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email }),
      }),
    );

    expect(magic.status).toBe(200);
    expect(send).toHaveBeenCalledWith(email, "magic", expect.stringContaining("/l/magic?token="));

    const reset = await auth.handler(
      new Request("http://auth.test/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email }),
      }),
    );

    expect(reset.status).toBe(200);
    expect(send).toHaveBeenCalledWith(email, "reset", expect.stringContaining("/l/reset?token="));
  });

  it("creates a credential through password recovery for a profile without one", async () => {
    const { createAuth } = await import("./index");
    const send = vi.fn<Mailer["send"]>(async () => undefined);
    const auth = createAuth({ mailer: { send } });
    const email = "recovery-only@example.com";

    await db.insert(user).values({
      id: "recovery-only-user",
      name: "Recovery Only",
      email,
      emailVerified: true,
    });

    const signinWithoutCredential = await auth.handler(
      new Request("http://auth.test/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email, password: "recovered-password" }),
      }),
    );

    expect(signinWithoutCredential.status).toBe(401);

    const duplicateSignup = await auth.handler(
      new Request("http://auth.test/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email, name: "Recovery Only", password: "new-password" }),
      }),
    );

    expect(duplicateSignup.status).toBe(422);
    expect(await duplicateSignup.json()).toMatchObject({
      code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
    });

    const resetRequest = await auth.handler(
      new Request("http://auth.test/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email }),
      }),
    );

    expect(resetRequest.status).toBe(200);
    const resetMessage = send.mock.calls.find(([, kind]) => kind === "reset");
    const resetLink = resetMessage?.[2];
    expect(resetLink).toEqual(expect.stringContaining("/l/reset?token="));
    const token = new URL(resetLink ?? "http://auth.test").searchParams.get("token");
    expect(token).toBeTruthy();

    const reset = await auth.handler(
      new Request("http://auth.test/api/auth/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ newPassword: "recovered-password", token }),
      }),
    );

    expect(reset.status).toBe(200);

    const signin = await auth.handler(
      new Request("http://auth.test/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ email, password: "recovered-password" }),
      }),
    );

    expect(signin.status).toBe(200);
    expect(await signin.json()).toMatchObject({ user: { email, name: "Recovery Only" } });

    const cookie = signin.headers.get("set-cookie")?.split(";", 1)[0];
    expect(cookie).toMatch(/session_token=/);

    const restored = await auth.handler(
      new Request("http://auth.test/api/auth/get-session", {
        headers: { cookie: cookie ?? "" },
      }),
    );

    expect(restored.status).toBe(200);
    expect(await restored.json()).toMatchObject({ user: { email, name: "Recovery Only" } });

    const reusedReset = await auth.handler(
      new Request("http://auth.test/api/auth/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "expo-origin": "trove:///",
        },
        body: JSON.stringify({ newPassword: "another-password", token }),
      }),
    );

    expect(reusedReset.status).toBe(400);
    expect(await reusedReset.json()).toMatchObject({ code: "INVALID_TOKEN" });
  });
});
