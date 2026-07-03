import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { StatusBadge } from "./StatusBadge";

describe("<StatusBadge>", () => {
  it.each([
    ["live", "Live"],
    ["beta", "Beta"],
    ["draft", "Draft"],
  ] as const)("renders the %s status with its localized label", (status, label) => {
    renderWithIntl(<StatusBadge status={status} />);
    const badge = screen.getByTestId(`status-${status}`);
    expect(badge).toHaveTextContent(label);
    expect(badge).toHaveClass(`status-${status}`);
  });
});
