import { describe, expect, it } from "vitest";
import { listCsv } from "./list-csv";

describe("listCsv", () => {
  it("writes the rows shown, numbers as numbers and shown text as text", () => {
    const csv = listCsv(
      "Country",
      ["Visitors", "Share"],
      [
        { key: "US", label: "United States", values: [340, 340], display: [null, "59%"] },
        { key: "DE", label: "Germany", values: [100, 100], display: [null, "17%"] },
      ],
    );
    expect(csv).toBe("Country,Visitors,Share\r\nUnited States,340,59%\r\nGermany,100,17%\r\n");
  });

  it("makes labels from the open internet safe for spreadsheets", () => {
    const csv = listCsv("Page", ["Views"], [{ key: "x", label: "=HYPERLINK(1)", values: [3] }]);
    expect(csv).toContain("'=HYPERLINK(1),3");
  });

  it("adds the second line as its own column when asked", () => {
    const csv = listCsv(
      "Search",
      ["Seen"],
      [{ key: "a", label: "ga4 dashboard", sublabel: "/pricing", values: [3200] }],
      "Page",
    );
    expect(csv).toBe("Search,Page,Seen\r\nga4 dashboard,/pricing,3200\r\n");
  });
});
