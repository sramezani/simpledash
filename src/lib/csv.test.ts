import { describe, expect, it } from "vitest";
import { csvCell, csvFilename, toCsv } from "./csv";

describe("csvCell", () => {
  it("quotes commas, quotes and line breaks (RFC 4180)", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
  });

  it("makes formula-looking text safe", () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-cmd")).toBe("'-cmd");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tx")).toBe("'\tx");
  });

  it("leaves numbers alone, including negatives", () => {
    expect(csvCell(1234)).toBe("1234");
    expect(csvCell(-12)).toBe("-12");
    expect(csvCell(null)).toBe("");
  });
});

describe("toCsv", () => {
  it("writes a header and rows with CRLF line ends", () => {
    expect(
      toCsv(
        ["Page", "Views"],
        [
          ["/", 3],
          ["/a,b", 1],
        ],
      ),
    ).toBe('Page,Views\r\n/,3\r\n"/a,b",1\r\n');
  });
});

describe("csvFilename", () => {
  it("builds a safe file name", () => {
    expect(csvFilename("mysite.com", "sources", "2026-10-04", "2026-10-10")).toBe(
      "simpledash-mysite.com-sources-2026-10-04-2026-10-10.csv",
    );
    expect(csvFilename("My Site/../x", "pages", "a", "b")).toBe(
      "simpledash-my-site-..-x-pages-a-b.csv",
    );
  });
});
