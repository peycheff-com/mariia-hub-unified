import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { CurrencyProvider, useCurrency } from "./CurrencyContext";

const TestConsumer = () => {
  const { currency, formatPrice } = useCurrency();
  return (
    <div data-testid="currency" data-currency={currency}>
      {formatPrice(100)}
    </div>
  );
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <CurrencyProvider>{children}</CurrencyProvider>
);

describe("CurrencyContext", () => {
  it("provides default currency and formatter", () => {
    render(<TestConsumer />, { wrapper });
    const node = screen.getByTestId("currency");
    expect(node.dataset.currency).toBe("PLN");
    expect(node).toHaveTextContent(/100 zł/);
  });
});
