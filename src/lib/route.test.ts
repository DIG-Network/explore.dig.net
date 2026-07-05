import { describe, expect, it } from "vitest";
import { parseRoute } from "./route";

describe("parseRoute", () => {
  it("classifies the home page", () => {
    expect(parseRoute("/")).toEqual({ kind: "home" });
    expect(parseRoute("")).toEqual({ kind: "home" });
    expect(parseRoute("/index.html")).toEqual({ kind: "home" });
  });

  it("classifies the Apps home-screen tab, with and without the trailing slash / index.html", () => {
    expect(parseRoute("/apps")).toEqual({ kind: "apps" });
    expect(parseRoute("/apps/")).toEqual({ kind: "apps" });
    expect(parseRoute("/apps/index.html")).toEqual({ kind: "apps" });
  });

  it("classifies app detail pages, with and without the trailing slash / index.html", () => {
    expect(parseRoute("/app/xchtip")).toEqual({ kind: "app", slug: "xchtip" });
    expect(parseRoute("/app/xchtip/")).toEqual({ kind: "app", slug: "xchtip" });
    expect(parseRoute("/app/xchtip/index.html")).toEqual({ kind: "app", slug: "xchtip" });
    expect(parseRoute("/app/c-xch2")).toEqual({ kind: "app", slug: "c-xch2" });
  });

  it("rejects malformed app paths", () => {
    expect(parseRoute("/app/")).toEqual({ kind: "not-found" });
    expect(parseRoute("/app/UPPER")).toEqual({ kind: "not-found" });
    expect(parseRoute("/app/x/y")).toEqual({ kind: "not-found" });
  });

  it("classifies anything else as not-found", () => {
    expect(parseRoute("/nope")).toEqual({ kind: "not-found" });
    expect(parseRoute("/appsxyz")).toEqual({ kind: "not-found" });
    expect(parseRoute("/apps/xchtip")).toEqual({ kind: "not-found" });
  });
});
