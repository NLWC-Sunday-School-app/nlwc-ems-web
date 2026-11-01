import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, csrfToken, errorCode, friendlyError } from "./api";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "nlwc_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("unwraps the data of the envelope and calls the same-origin /api/v1 path with credentials", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, data: { personId: "p1" } }));
    await expect(api.get("/auth/me")).resolves.toEqual({ personId: "p1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/me");
    expect(init.credentials).toBe("same-origin");
    expect(init.method).toBe("GET");
  });

  it("reads the CSRF cookie and echoes it on state-changing calls only", async () => {
    document.cookie = "nlwc_csrf=abc%2B123; path=/";
    expect(csrfToken()).toBe("abc+123");
    fetchMock.mockImplementation(() => Promise.resolve(json(200, { success: true })));

    await api.post("/profile", { a: 1 });
    expect(fetchMock.mock.calls[0][1].headers["X-CSRF-Token"]).toBe("abc+123");
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
    expect(fetchMock.mock.calls[0][1].body).toBe('{"a":1}');

    await api.del("/dependant/1/collector/2");
    expect(fetchMock.mock.calls[1][1].headers["X-CSRF-Token"]).toBe("abc+123");

    await api.get("/profile");
    expect(fetchMock.mock.calls[2][1].headers["X-CSRF-Token"]).toBeUndefined();
  });

  it("sends no CSRF header when there is no cookie yet", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json(200, { success: true })));
    await api.post("/auth/login", {});
    expect(fetchMock.mock.calls[0][1].headers["X-CSRF-Token"]).toBeUndefined();
  });

  it("throws an ApiError carrying the status, the machine-readable code and the message", async () => {
    fetchMock.mockResolvedValue(json(409, { success: false, code: "already_registered", message: "Already there." }));
    const error = await api.post("/registration", {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: "already_registered", message: "Already there." });
    expect(errorCode(error)).toBe("already_registered");
  });

  it("never surfaces a raw 500 body", async () => {
    fetchMock.mockResolvedValue(new Response("System.NullReferenceException at Foo.Bar()", { status: 500 }));
    const error = (await api.get("/profile").catch((e) => e)) as ApiError;
    expect(error.status).toBe(500);
    expect(error.code).toBeNull();
    expect(error.message).not.toContain("NullReference");
  });

  it("turns a network failure into a code the UI can recognise", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const error = (await api.get("/profile").catch((e) => e)) as ApiError;
    expect(error).toMatchObject({ status: 0, code: "network" });
  });

  it("treats success:false on a 200 as a failure", async () => {
    fetchMock.mockResolvedValue(json(200, { success: false, message: "Nope", code: "x" }));
    await expect(api.get("/x")).rejects.toMatchObject({ code: "x" });
  });

  it("uses plain language for the registration codes and falls back to the API message", () => {
    expect(friendlyError(new ApiError(400, "dob_required", "Add a date of birth before registering."))).toMatch(/profile/i);
    expect(friendlyError(new ApiError(400, "camp_age_ineligible", "x"))).toMatch(/10 to 16/);
    expect(friendlyError(new ApiError(400, "something_new", "Server words"))).toBe("Server words");
    expect(friendlyError(new Error("boom"))).not.toContain("boom");
  });
});
