// Tests for the safe markdown subset renderer (SPEC.md §3 description format).

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Markdown, parseBlocks, renderInline } from "./markdown";

describe("parseBlocks", () => {
  it("groups consecutive lines into one paragraph", () => {
    expect(parseBlocks("line one\nline two")).toEqual([{ type: "p", text: "line one line two" }]);
  });

  it("splits paragraphs on blank lines", () => {
    expect(parseBlocks("a\n\nb")).toEqual([
      { type: "p", text: "a" },
      { type: "p", text: "b" },
    ]);
  });

  it("parses ## and ### headings", () => {
    expect(parseBlocks("## Title\n\n### Sub")).toEqual([
      { type: "h2", text: "Title" },
      { type: "h3", text: "Sub" },
    ]);
  });

  it("parses - and * bullet lists", () => {
    expect(parseBlocks("- one\n- two\n* three")).toEqual([{ type: "ul", items: ["one", "two", "three"] }]);
  });

  it("separates a list from a following paragraph", () => {
    expect(parseBlocks("- one\nplain text")).toEqual([
      { type: "ul", items: ["one"] },
      { type: "p", text: "plain text" },
    ]);
  });

  it("returns no blocks for empty input", () => {
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks("\n\n")).toEqual([]);
  });
});

describe("renderInline", () => {
  it("renders code spans", () => {
    render(<p>{renderInline("use `digstore` here")}</p>);
    expect(screen.getByText("digstore").tagName).toBe("CODE");
  });

  it("renders http(s) links with rel=noopener", () => {
    render(<p>{renderInline("see [docs](https://docs.dig.net)")}</p>);
    const a = screen.getByRole("link", { name: "docs" });
    expect(a).toHaveAttribute("href", "https://docs.dig.net");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does NOT link non-http(s) targets (renders as plain text)", () => {
    render(<p data-testid="out">{renderInline("[x](javascript:alert(1))")}</p>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByTestId("out")).toHaveTextContent("[x](javascript:alert(1))");
  });

  it("renders bold and italic", () => {
    render(<p>{renderInline("**bold** and *soft*")}</p>);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("soft").tagName).toBe("EM");
  });

  it("passes plain text through unchanged", () => {
    expect(renderInline("just text")).toEqual(["just text"]);
  });
});

describe("<Markdown>", () => {
  it("renders the full subset and never uses innerHTML (HTML stays inert text)", () => {
    render(
      <Markdown source={"## Head\n\npara with **bold**\n\n- item\n\n<script>alert(1)</script>"} />,
    );
    // Author ## renders as h3 — the page's h1/h2 belong to the store chrome.
    expect(screen.getByRole("heading", { level: 3, name: "Head" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("item");
    // Raw HTML is not parsed: the literal tag text is visible, no script element exists.
    expect(document.querySelector(".markdown script")).toBeNull();
    expect(screen.getByText(/<script>/)).toBeInTheDocument();
  });
});
