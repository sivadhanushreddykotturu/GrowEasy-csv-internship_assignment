import { RawRow } from "../types/crm";

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

/**
 * Phase 1: Schema discovery prompt.
 * Sends headers + sample rows to identify column mappings.
 */
export function buildSchemaDiscoveryPrompt(
  headers: string[],
  sampleRows: RawRow[]
): string {
  return `You are a CRM data mapping expert. Analyze the following CSV headers and sample rows, then identify which CSV column maps to each GrowEasy CRM field.

CSV Headers:
${JSON.stringify(headers)}

Sample Rows (first ${sampleRows.length} rows):
${JSON.stringify(sampleRows, null, 2)}

GrowEasy CRM Fields to map:
${CRM_FIELDS.join(", ")}

Rules:
- Map each CRM field to the most likely CSV column name (use the exact CSV header string).
- If no column clearly maps to a CRM field, use null.
- For "created_at": look for date/time columns (timestamp, date, created, submitted_at, etc.)
- For "name": look for full name, contact name, person name, lead name, client name, etc.
- For "email": look for email, e-mail, mail, email_address, etc.
- For "country_code": look for country code, dial code, phone prefix, isd code, etc.
- For "mobile_without_country_code": look for phone, mobile, contact number, cell, number, etc.
- For "company": look for company, organization, business, firm, employer, etc.
- For "crm_status": look for status, lead status, disposition, outcome, etc.
- For "data_source": look for source, lead source, campaign, origin, channel, etc.
- For "crm_note": look for notes, remarks, comments, description, feedback, etc.
- For "possession_time": look for possession, handover, move-in date, delivery date, etc.
- For "lead_owner": look for owner, assigned to, agent, salesperson, rep, etc.
- For "description": look for additional info, extra details, more info, etc.

Respond ONLY with a valid JSON object mapping CRM field → CSV column name (or null). No explanation.

Example response:
{
  "created_at": "Timestamp",
  "name": "Full Name",
  "email": "Email Address",
  "country_code": null,
  "mobile_without_country_code": "Phone Number",
  ...
}`;
}

/**
 * Phase 2: Batch extraction prompt.
 * Uses the pre-computed column mapping to extract CRM records from a batch of rows.
 */
export function buildBatchExtractionPrompt(
  batch: RawRow[],
  columnMapping: Record<string, string | null>
): string {
  return `You are a CRM data extraction specialist for GrowEasy. Extract CRM records from the following raw CSV rows.

Column Mapping (CSV column → CRM field):
${JSON.stringify(columnMapping, null, 2)}

Raw CSV Rows to process:
${JSON.stringify(batch, null, 2)}

Extract each row into the GrowEasy CRM format and return a JSON array. Follow these rules STRICTLY:

1. REQUIRED FIELDS:
   - At least one of "email" or "mobile_without_country_code" must be present and non-empty.
   - If BOTH are missing or empty, set { "_skip": true } for that record.

2. crm_status — MUST be exactly one of (or empty string ""):
   ${CRM_STATUS_VALUES.join(" | ")}
   - Map intelligently: "interested" → GOOD_LEAD_FOLLOW_UP, "not reachable" → DID_NOT_CONNECT, "not interested" → BAD_LEAD, "converted"/"closed"/"won" → SALE_DONE

3. data_source — MUST be exactly one of (or empty string ""):
   ${DATA_SOURCE_VALUES.join(" | ")}
   - Only use these exact values. If none match, use "".

4. created_at — Must be a date string parseable by JavaScript new Date(). Format: "YYYY-MM-DD HH:mm:ss" preferred.
   - If missing, use today's date: ${new Date().toISOString().slice(0, 19).replace("T", " ")}

5. MULTIPLE VALUES:
   - Multiple emails: use first in "email" field, append rest to "crm_note" (prefix with "Additional emails: ")
   - Multiple phones: use first in "mobile_without_country_code", append rest to "crm_note" (prefix with "Additional phones: ")

6. country_code: Extract just the numeric/+ prefix (e.g., "+91", "+1"). Do not include the phone number.

7. mobile_without_country_code: Strip leading country code digits if present. Return only the local number digits.

8. crm_note: Combine notes/remarks/comments from any relevant columns. Separate with " | ".

9. CSV SAFETY: Do not include raw newlines in field values. Replace with \n escape sequence.

10. UNKNOWN/AMBIGUOUS: Use intelligent inference based on context clues in the data.

Respond ONLY with a valid JSON array. Each element is either a CRM record object or { "_skip": true }.
Return exactly ${batch.length} elements (one per input row).

CRM record schema:
{
  "created_at": string,
  "name": string,
  "email": string,
  "country_code": string,
  "mobile_without_country_code": string,
  "company": string,
  "city": string,
  "state": string,
  "country": string,
  "lead_owner": string,
  "crm_status": "${CRM_STATUS_VALUES.join('" | "')}" | "",
  "crm_note": string,
  "data_source": "${DATA_SOURCE_VALUES.join('" | "')}" | "",
  "possession_time": string,
  "description": string
}`;
}
