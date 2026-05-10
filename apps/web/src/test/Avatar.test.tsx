import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../components/ui/Avatar";

describe("Avatar", () => {
  it("renders image when src is provided", () => {
    render(<Avatar name="Alice" src="https://example.com/alice.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/alice.jpg");
  });

  it("renders initials when no src", () => {
    render(<Avatar name="Alice Smith" />);
    expect(screen.getByText("AS")).toBeDefined();
  });

  it("renders single initial for single-word names", () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText("A")).toBeDefined();
  });

  it("shows name as title attribute", () => {
    const { container } = render(<Avatar name="Bob Jones" />);
    const el = container.querySelector("[title]");
    expect(el?.getAttribute("title")).toBe("Bob Jones");
  });
});
