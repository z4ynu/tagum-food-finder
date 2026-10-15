export const MAX_EVIDENCE_FILES = 5;
export const MAX_EVIDENCE_FILE_BYTES = 5 * 1024 * 1024;

export const SUPPORTED_EVIDENCE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type CorrectionIssueKey =
  | "price_menu"
  | "food_cuisine"
  | "occasion"
  | "opening_hours"
  | "temporary_closure"
  | "permanent_closure"
  | "moved_location"
  | "duplicate_place"
  | "contact_information"
  | "photo_menu";

export type CorrectionIssue = Readonly<{
  detailLabel: string;
  detailPlaceholder: string;
  evidence: "optional" | "required";
  key: CorrectionIssueKey;
  label: string;
  supportingText: string;
}>;

export const CORRECTION_ISSUES: readonly CorrectionIssue[] = [
  {
    detailLabel: "What price or menu information should we use?",
    detailPlaceholder: "Example: Meals usually cost ₱120 to ₱180 per person.",
    evidence: "required",
    key: "price_menu",
    label: "Price or menu",
    supportingText: "Average price, menu items, or menu availability",
  },
  {
    detailLabel: "What food or cuisine should be listed?",
    detailPlaceholder: "Example: Filipino noodles, batchoy, and rice meals.",
    evidence: "optional",
    key: "food_cuisine",
    label: "Food or cuisine",
    supportingText: "Cuisine, specialty, or craving category",
  },
  {
    detailLabel: "Which occasions fit this place?",
    detailPlaceholder: "Example: Solo meal and quick barkada lunch.",
    evidence: "optional",
    key: "occasion",
    label: "Occasion suitability",
    supportingText: "Date night, family dinner, barkada hangout, or solo meal",
  },
  {
    detailLabel: "What are the correct opening hours?",
    detailPlaceholder: "Include the days and opening and closing times you can verify.",
    evidence: "required",
    key: "opening_hours",
    label: "Opening hours",
    supportingText: "Regular or special operating hours",
  },
  {
    detailLabel: "What do you know about the temporary closure?",
    detailPlaceholder: "Include when you saw the closure and any reopening information.",
    evidence: "required",
    key: "temporary_closure",
    label: "Temporarily closed",
    supportingText: "Closed for now but expected to reopen",
  },
  {
    detailLabel: "What confirms that this place closed permanently?",
    detailPlaceholder: "Describe the closure and when you confirmed it.",
    evidence: "required",
    key: "permanent_closure",
    label: "Permanently closed",
    supportingText: "No longer operating at this place",
  },
  {
    detailLabel: "What is the correct location?",
    detailPlaceholder: "Provide the new address or a clear nearby landmark.",
    evidence: "required",
    key: "moved_location",
    label: "Moved location",
    supportingText: "Now operating at a different address",
  },
  {
    detailLabel: "Which existing place is this a duplicate of?",
    detailPlaceholder: "Provide the other place name or paste its Asa Ta Mangaon? link.",
    evidence: "optional",
    key: "duplicate_place",
    label: "Duplicate place",
    supportingText: "The same place appears more than once",
  },
  {
    detailLabel: "What contact information should be corrected?",
    detailPlaceholder: "Provide the correct phone number, website, or social page.",
    evidence: "optional",
    key: "contact_information",
    label: "Contact information",
    supportingText: "Phone number, website, or social page",
  },
  {
    detailLabel: "What photo or menu information is missing or incorrect?",
    detailPlaceholder: "Describe what the attachment shows and what should be corrected.",
    evidence: "required",
    key: "photo_menu",
    label: "Photo or menu",
    supportingText: "Missing, outdated, or incorrect media",
  },
] as const;

export function findCorrectionIssue(key: CorrectionIssueKey | null) {
  return CORRECTION_ISSUES.find((issue) => issue.key === key) ?? null;
}

export function correctionRequiresEvidence(key: CorrectionIssueKey | null) {
  return findCorrectionIssue(key)?.evidence === "required";
}

export type EvidenceFileMetadata = Readonly<{
  name: string;
  size: number;
  type: string;
}>;

export function evidenceFileError(file: EvidenceFileMetadata): string | null {
  if (!(SUPPORTED_EVIDENCE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name} must be a JPEG, PNG, or WebP image.`;
  }

  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    return `${file.name} is larger than 5 MB.`;
  }

  return null;
}
