import {
  buildSchemaDiscoveryPrompt,
  buildBatchExtractionPrompt,
} from "../services/promptBuilder";
import { RawRow } from "../types/crm";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_HEADERS = [
  "Full Name",
  "Email Address",
  "Phone Number",
  "Company",
  "Lead Source",
  "Status",
  "Notes",
];

const SAMPLE_ROWS: RawRow[] = [
  {
    "Full Name": "Alice Smith",
    "Email Address": "alice@example.com",
    "Phone Number": "9876543210",
    Company: "Acme Inc.",
    "Lead Source": "leads_on_demand",
    Status: "interested",
    Notes: "Interested in 2BHK",
  },
  {
    "Full Name": "Bob Jones",
    "Email Address": "bob@example.com",
    "Phone Number": "9123456789",
    Company: "Wayne Corp",
    "Lead Source": "meridian_tower",
    Status: "not reachable",
    Notes: "",
  },
];

const COLUMN_MAPPING: Record<string, string | null> = {
  created_at: null,
  name: "Full Name",
  email: "Email Address",
  country_code: null,
  mobile_without_country_code: "Phone Number",
  company: "Company",
  city: null,
  state: null,
  country: null,
  lead_owner: null,
  crm_status: "Status",
  crm_note: "Notes",
  data_source: "Lead Source",
  possession_time: null,
  description: null,
};

// ─── CRM field list (mirrors the source) ─────────────────────────────────────

const CRM_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

// ─── buildSchemaDiscoveryPrompt ───────────────────────────────────────────────

describe("buildSchemaDiscoveryPrompt", () => {
  let prompt: string;

  beforeEach(() => {
    prompt = buildSchemaDiscoveryPrompt(SAMPLE_HEADERS, SAMPLE_ROWS);
  });

  it("returns a non-empty string", () => {
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("contains all 15 CRM field names", () => {
    expect(CRM_FIELDS).toHaveLength(15);
    for (const field of CRM_FIELDS) {
      expect(prompt).toContain(field);
    }
  });

  it("contains every CSV header passed in", () => {
    for (const header of SAMPLE_HEADERS) {
      expect(prompt).toContain(header);
    }
  });

  it("includes the sample row data in the prompt", () => {
    expect(prompt).toContain("Alice Smith");
    expect(prompt).toContain("alice@example.com");
    expect(prompt).toContain("Bob Jones");
  });

  it("mentions the number of sample rows", () => {
    expect(prompt).toContain(String(SAMPLE_ROWS.length));
  });

  it("instructs the model to respond with valid JSON only", () => {
    expect(prompt).toContain("JSON");
  });
});

// ─── buildBatchExtractionPrompt ───────────────────────────────────────────────

describe("buildBatchExtractionPrompt", () => {
  let prompt: string;

  beforeEach(() => {
    prompt = buildBatchExtractionPrompt(SAMPLE_ROWS, COLUMN_MAPPING);
  });

  it("returns a non-empty string", () => {
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("contains all required CRM status values", () => {
    for (const status of CRM_STATUS_VALUES) {
      expect(prompt).toContain(status);
    }
  });

  it("contains all data_source values", () => {
    for (const source of DATA_SOURCE_VALUES) {
      expect(prompt).toContain(source);
    }
  });

  it("includes the batch row count", () => {
    expect(prompt).toContain(String(SAMPLE_ROWS.length));
  });

  it("mentions the skip rule (missing email AND mobile)", () => {
    // The prompt must explain the _skip:true rule
    expect(prompt).toContain("_skip");
    expect(prompt).toContain("email");
    expect(prompt).toContain("mobile_without_country_code");
  });

  it("includes the column mapping JSON in the prompt", () => {
    // All non-null mapped column names should be visible
    expect(prompt).toContain("Full Name");
    expect(prompt).toContain("Email Address");
    expect(prompt).toContain("Phone Number");
  });

  it("includes the raw row data in the prompt", () => {
    expect(prompt).toContain("Alice Smith");
    expect(prompt).toContain("bob@example.com");
  });

  it("instructs the model to respond with a JSON array only", () => {
    expect(prompt).toContain("JSON array");
  });

  it("contains crm_status mapping hints (interested → GOOD_LEAD_FOLLOW_UP)", () => {
    expect(prompt).toContain("GOOD_LEAD_FOLLOW_UP");
    expect(prompt).toContain("DID_NOT_CONNECT");
    expect(prompt).toContain("BAD_LEAD");
    expect(prompt).toContain("SALE_DONE");
  });

  it("works with a single-row batch", () => {
    const singleRowPrompt = buildBatchExtractionPrompt(
      [SAMPLE_ROWS[0]],
      COLUMN_MAPPING
    );
    expect(singleRowPrompt).toContain("1");
    expect(singleRowPrompt).toContain("Alice Smith");
  });
});
