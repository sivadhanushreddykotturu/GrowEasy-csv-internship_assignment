import { RawRow, CRMRecord, AIRecord } from "../types/crm";

// ─── Mock groq-sdk ────────────────────────────────────────────────────────────
// Must be hoisted before any import that uses groq-sdk.

const mockCreate = jest.fn();

jest.mock("groq-sdk", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

// Import after mocking
import { processWithGroq } from "../services/groqService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRawRow(overrides: Partial<RawRow> = {}): RawRow {
  return {
    "Full Name": "Alice Smith",
    "Email Address": "alice@example.com",
    "Phone Number": "9876543210",
    ...overrides,
  };
}

function makeCRMRecord(overrides: Partial<CRMRecord> = {}): CRMRecord {
  return {
    created_at: "2024-01-01 00:00:00",
    name: "Alice Smith",
    email: "alice@example.com",
    country_code: "+91",
    mobile_without_country_code: "9876543210",
    company: "Acme Inc.",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    lead_owner: "",
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    crm_note: "",
    data_source: "leads_on_demand",
    possession_time: "",
    description: "",
    ...overrides,
  };
}

/** Build a mock Groq API response payload */
function buildGroqResponse(content: string) {
  return {
    choices: [{ message: { content } }],
  };
}

// ─── processWithGroq ─────────────────────────────────────────────────────────

describe("processWithGroq", () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-api-key-123";
    mockCreate.mockReset();
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  // ── Empty input ──────────────────────────────────────────────────────────

  it("returns empty data and zero skipped for an empty rows array", async () => {
    const result = await processWithGroq([]);

    expect(result).toEqual({ data: [], skipped: 0 });
    // Should not have called Groq API at all
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // ── Valid records ────────────────────────────────────────────────────────

  it("returns valid CRM records in the data array", async () => {
    const rows = [makeRawRow(), makeRawRow({ "Full Name": "Bob Jones" })];
    const record1 = makeCRMRecord();
    const record2 = makeCRMRecord({ name: "Bob Jones" });

    const schemaMapping = {
      created_at: null,
      name: "Full Name",
      email: "Email Address",
      country_code: null,
      mobile_without_country_code: "Phone Number",
      company: null,
      city: null,
      state: null,
      country: null,
      lead_owner: null,
      crm_status: null,
      crm_note: null,
      data_source: null,
      possession_time: null,
      description: null,
    };

    // First call → schema discovery; second call → batch extraction
    mockCreate
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify(schemaMapping)))
      .mockResolvedValueOnce(
        buildGroqResponse(JSON.stringify([record1, record2]))
      );

    const result = await processWithGroq(rows);

    expect(result.data).toHaveLength(2);
    expect(result.skipped).toBe(0);
    expect(result.data[0].email).toBe("alice@example.com");
    expect(result.data[1].name).toBe("Bob Jones");
  });

  // ── Skipped records ──────────────────────────────────────────────────────

  it("counts records with _skip:true as skipped and excludes them from data", async () => {
    const rows = [makeRawRow(), makeRawRow()];
    const skippedRecord: AIRecord = { _skip: true, reason: "No email or mobile" };
    const validRecord = makeCRMRecord();

    const schemaMapping = { name: "Full Name", email: "Email Address" };

    mockCreate
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify(schemaMapping)))
      .mockResolvedValueOnce(
        buildGroqResponse(JSON.stringify([skippedRecord, validRecord]))
      );

    const result = await processWithGroq(rows);

    expect(result.skipped).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].email).toBe("alice@example.com");
  });

  it("counts ALL records as skipped when every record has _skip:true", async () => {
    const rows = [makeRawRow(), makeRawRow()];
    const skipped: AIRecord[] = [
      { _skip: true, reason: "No contact info" },
      { _skip: true, reason: "No contact info" },
    ];

    mockCreate
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify({})))
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify(skipped)));

    const result = await processWithGroq(rows);

    expect(result.skipped).toBe(2);
    expect(result.data).toHaveLength(0);
  });

  // ── onProgress callback ──────────────────────────────────────────────────

  it("calls the onProgress callback with correct processed/total values", async () => {
    const rows = [makeRawRow()];
    const record = makeCRMRecord();

    mockCreate
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify({})))
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify([record])));

    const progressCalls: Array<[number, number]> = [];
    await processWithGroq(rows, (processed, total) => {
      progressCalls.push([processed, total]);
    });

    expect(progressCalls.length).toBeGreaterThan(0);
    const [lastProcessed, lastTotal] = progressCalls[progressCalls.length - 1];
    expect(lastTotal).toBe(1);
    expect(lastProcessed).toBeLessThanOrEqual(lastTotal);
  });

  // ── API call behaviour ───────────────────────────────────────────────────

  it("makes exactly 2 Groq API calls for a single batch (schema + extraction)", async () => {
    const rows = [makeRawRow()];
    const record = makeCRMRecord();

    mockCreate
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify({})))
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify([record])));

    await processWithGroq(rows);

    // 1 schema discovery + 1 batch extraction = 2 total calls
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  // ── Graceful parse failure ───────────────────────────────────────────────

  it("skips all rows in a batch when Groq returns invalid JSON", async () => {
    const rows = [makeRawRow(), makeRawRow()];

    mockCreate
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify({})))
      .mockResolvedValueOnce(buildGroqResponse("NOT VALID JSON !!!"));

    const result = await processWithGroq(rows);

    expect(result.data).toHaveLength(0);
    expect(result.skipped).toBe(2);
  });

  // ── Markdown stripping ───────────────────────────────────────────────────

  it("handles Groq responses wrapped in markdown code blocks", async () => {
    const rows = [makeRawRow()];
    const record = makeCRMRecord();

    // Simulate model wrapping JSON in ```json ... ```
    const wrappedResponse = "```json\n" + JSON.stringify([record]) + "\n```";

    mockCreate
      .mockResolvedValueOnce(buildGroqResponse(JSON.stringify({})))
      .mockResolvedValueOnce(buildGroqResponse(wrappedResponse));

    const result = await processWithGroq(rows);

    expect(result.data).toHaveLength(1);
    expect(result.skipped).toBe(0);
  });
});
