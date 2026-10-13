import { describe, expect, it } from "vitest";
import { paymentReferrers } from "./payment-pages";

describe("paymentReferrers", () => {
  it("finds payment pages among the sources, subdomains included", () => {
    expect(
      paymentReferrers([
        { source: "google", visitors: 900 },
        { source: "checkout.stripe.com", visitors: 14 },
        { source: "www.paypal.com", visitors: 3 },
        { source: "yourshop.lemonsqueezy.com", visitors: 2 },
        { source: "notstripe.com", visitors: 5 },
        { source: "pay.stripe.com", visitors: 0 },
      ]),
    ).toEqual(["checkout.stripe.com", "paypal.com", "yourshop.lemonsqueezy.com"]);
  });
});
