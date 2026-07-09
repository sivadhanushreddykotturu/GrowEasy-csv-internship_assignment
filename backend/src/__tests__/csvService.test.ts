import { parseCSV, getSampleRows } from "../services/csvService";
import { RawRow } from "../types/crm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toBuffer(str: string): Buffer {
  return Buffer.from(str, "utf-8");
}

// ─── parseCSV ────────────────────────────────────────────────────────────────

describe("parseCSV", () => {
  it("parses a standard comma-delimited CSV", () => {
    const csv = `name,email,mobile\nAlice,alice@example.com,9876543210\nBob,bob@example.com,9123456789`;
    const rows = parseCSV(toBuffer(csv));

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      name: "Alice",
      email: "alice@example.com",
      mobile: "9876543210",
    });
    expect(rows[1]).toEqual({
      name: "Bob",
      email: "bob@example.com",
      mobile: "9123456789",
    });
  });

  it("strips a UTF-8 BOM character from the start", () => {
    // BOM is \uFEFF (0xEF 0xBB 0xBF in UTF-8)
    const csvWithBOM = "\uFEFFname,email\nAlice,alice@example.com";
    const rows = parseCSV(toBuffer(csvWithBOM));

    expect(rows).toHaveLength(1);
    // Header key must NOT start with the BOM character
    const firstKey = Object.keys(rows[0])[0];
    expect(firstKey).toBe("name");
    expect(firstKey.charCodeAt(0)).not.toBe(0xfeff);
  });

  it("auto-detects semicolon delimiter", () => {
    const csv = `name;email;mobile\nAlice;alice@example.com;9876543210\nBob;bob@example.com;9123456789`;
    const rows = parseCSV(toBuffer(csv));

    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Alice");
    expect(rows[0].email).toBe("alice@example.com");
    expect(rows[0].mobile).toBe("9876543210");
  });

  it("auto-detects tab delimiter", () => {
    const csv = `name\temail\tmobile\nAlice\talice@example.com\t9876543210\nBob\tbob@example.com\t9123456789`;
    const rows = parseCSV(toBuffer(csv));

    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Alice");
    expect(rows[0].email).toBe("alice@example.com");
    expect(rows[0].mobile).toBe("9876543210");
  });

  it("skips empty lines in the CSV", () => {
    const csv = `name,email\nAlice,alice@example.com\n\n\nBob,bob@example.com\n`;
    const rows = parseCSV(toBuffer(csv));

    expect(rows).toHaveLength(2);
  });

  it("trims whitespace from field values", () => {
    const csv = `name,email\n  Alice  ,  alice@example.com  `;
    const rows = parseCSV(toBuffer(csv));

    expect(rows[0].name).toBe("Alice");
    expect(rows[0].email).toBe("alice@example.com");
  });

  it("returns an empty array for a header-only CSV", () => {
    const csv = `name,email,mobile\n`;
    const rows = parseCSV(toBuffer(csv));

    expect(rows).toHaveLength(0);
  });

  it("returns an empty array for completely empty input", () => {
    const rows = parseCSV(toBuffer(""));
    expect(rows).toHaveLength(0);
  });

  it("handles quoted fields containing commas", () => {
    const csv = `name,company\nAlice,"Acme, Inc."`;
    const rows = parseCSV(toBuffer(csv));

    expect(rows).toHaveLength(1);
    expect(rows[0].company).toBe("Acme, Inc.");
  });
});

// ─── getSampleRows ────────────────────────────────────────────────────────────

describe("getSampleRows", () => {
  const makeRows = (n: number): RawRow[] =>
    Array.from({ length: n }, (_, i) => ({ id: String(i + 1) }));

  it("returns the first n rows when the array is larger than n", () => {
    const rows = makeRows(10);
    const sample = getSampleRows(rows, 3);

    expect(sample).toHaveLength(3);
    expect(sample[0]).toEqual({ id: "1" });
    expect(sample[2]).toEqual({ id: "3" });
  });

  it("returns all rows when the array has fewer than n rows", () => {
    const rows = makeRows(2);
    const sample = getSampleRows(rows, 5);

    expect(sample).toHaveLength(2);
  });

  it("defaults to 3 rows when no second argument is provided", () => {
    const rows = makeRows(10);
    const sample = getSampleRows(rows);

    expect(sample).toHaveLength(3);
  });

  it("returns an empty array when given an empty input", () => {
    const sample = getSampleRows([], 3);
    expect(sample).toHaveLength(0);
  });

  it("returns exactly n=1 row when requested", () => {
    const rows = makeRows(5);
    const sample = getSampleRows(rows, 1);

    expect(sample).toHaveLength(1);
    expect(sample[0]).toEqual({ id: "1" });
  });
});
