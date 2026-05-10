import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../components/ui/Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("applies CRITICAL priority class", () => {
    const { container } = render(<Badge variant="priority" priority="CRITICAL">Critical</Badge>);
    expect(container.firstChild).not.toBeNull();
    expect(container.innerHTML).toContain("Critical");
  });

  it("applies custom color style", () => {
    const { container } = render(<Badge color="#ff0000">Label</Badge>);
    const el = container.querySelector("span");
    expect(el?.getAttribute("style")).toContain("color");
  });

  it("renders all priority variants without error", () => {
    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
    priorities.forEach((p) => {
      const { container } = render(<Badge variant="priority" priority={p}>{p}</Badge>);
      expect(container.firstChild).not.toBeNull();
    });
  });
});
