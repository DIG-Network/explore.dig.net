import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { FilterBar } from "./FilterBar";

const noop = () => {};

describe("<FilterBar>", () => {
  it("renders a chip per present category plus All, with aria-pressed state", () => {
    renderWithIntl(
      <FilterBar categories={["payments", "defi"]} category="defi" query="" onCategoryChange={noop} onQueryChange={noop} />,
    );
    expect(screen.getByTestId("category-all")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("category-defi")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("category-payments")).toHaveAttribute("aria-pressed", "false");
  });

  it("reports category and query changes", async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();
    const onQueryChange = vi.fn();
    renderWithIntl(
      <FilterBar categories={["payments"]} category="all" query="" onCategoryChange={onCategoryChange} onQueryChange={onQueryChange} />,
    );
    await user.click(screen.getByTestId("category-payments"));
    expect(onCategoryChange).toHaveBeenCalledWith("payments");
    await user.type(screen.getByTestId("search-input"), "t");
    expect(onQueryChange).toHaveBeenCalledWith("t");
  });

  it("shows clear-filters only when a filter is active, and it resets both", async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();
    const onQueryChange = vi.fn();
    const { unmount } = renderWithIntl(
      <FilterBar categories={["payments"]} category="all" query="" onCategoryChange={noop} onQueryChange={noop} />,
    );
    expect(screen.queryByTestId("clear-filters")).toBeNull();
    unmount();

    renderWithIntl(
      <FilterBar categories={["payments"]} category="payments" query="x" onCategoryChange={onCategoryChange} onQueryChange={onQueryChange} />,
    );
    await user.click(screen.getByTestId("clear-filters"));
    expect(onCategoryChange).toHaveBeenCalledWith("all");
    expect(onQueryChange).toHaveBeenCalledWith("");
  });
});
