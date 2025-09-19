import Papa from "papaparse";
import { z } from "zod";
import type { CsvRow } from "@/components/links/CsvPreviewTable";

export interface ColumnMapping {
  destinationUrl: string;
  customSlug?: string;
  title?: string;
  tags?: string;
  folder?: string;
}

export interface ParseResult {
  rows: CsvRow[];
  errors: string[];
}

const urlSchema = z.string().url().or(
  z.string().regex(/^https?:\/\/.+/i, "Invalid URL format")
);

const slugSchema = z.string()
  .regex(/^[a-zA-Z0-9-_]+$/, "Slug can only contain letters, numbers, hyphens, and underscores")
  .min(1)
  .max(100)
  .optional()
  .nullable();

export async function parseCsvFile(
  file: File,
  columnMapping: ColumnMapping,
  existingSlugs: Set<string> = new Set()
): Promise<ParseResult> {
  return new Promise((resolve) => {
    const rows: CsvRow[] = [];
    const errors: string[] = [];
    const slugsInFile = new Set<string>();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/['"]/g, ""),
      complete: (results) => {
        results.data.forEach((row: any, index: number) => {
          const csvRow: CsvRow = {
            destinationUrl: "",
            customSlug: undefined,
            title: undefined,
            tags: undefined,
            folder: undefined,
            validation: {
              status: "valid",
              messages: [],
            },
          };

          // Extract values based on column mapping
          if (columnMapping.destinationUrl) {
            csvRow.destinationUrl = row[columnMapping.destinationUrl]?.trim() || "";
          }

          if (columnMapping.customSlug) {
            csvRow.customSlug = row[columnMapping.customSlug]?.trim() || undefined;
          }

          if (columnMapping.title) {
            csvRow.title = row[columnMapping.title]?.trim() || undefined;
          }

          if (columnMapping.tags) {
            const tagsValue = row[columnMapping.tags]?.trim();
            if (tagsValue) {
              // Handle comma-separated tags, possibly within quotes
              csvRow.tags = tagsValue
                .split(",")
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.length > 0);
            }
          }

          if (columnMapping.folder) {
            csvRow.folder = row[columnMapping.folder]?.trim() || undefined;
          }

          // Validate the row
          const validationMessages: string[] = [];
          let status: CsvRow["validation"]["status"] = "valid";

          // Validate URL
          if (!csvRow.destinationUrl) {
            validationMessages.push("Destination URL is required");
            status = "error";
          } else {
            try {
              urlSchema.parse(csvRow.destinationUrl);
            } catch (err) {
              validationMessages.push("Invalid URL format");
              status = "error";
            }
          }

          // Validate slug
          if (csvRow.customSlug) {
            try {
              slugSchema.parse(csvRow.customSlug);
              
              // Check for duplicates within file
              if (slugsInFile.has(csvRow.customSlug)) {
                validationMessages.push("Duplicate slug in file");
                status = status === "error" ? "error" : "warning";
              } else {
                slugsInFile.add(csvRow.customSlug);
              }

              // Check for duplicates with existing slugs
              if (existingSlugs.has(csvRow.customSlug)) {
                validationMessages.push("Slug already exists in workspace");
                status = status === "error" ? "error" : "warning";
              }
            } catch (err) {
              validationMessages.push("Invalid slug format");
              status = "error";
            }
          }

          // Validate title length
          if (csvRow.title && csvRow.title.length > 255) {
            validationMessages.push("Title too long (max 255 characters)");
            status = status === "error" ? "error" : "warning";
          }

          // Validate tags
          if (csvRow.tags) {
            if (csvRow.tags.length > 10) {
              validationMessages.push("Too many tags (max 10)");
              status = status === "error" ? "error" : "warning";
              csvRow.tags = csvRow.tags.slice(0, 10);
            }

            csvRow.tags.forEach((tag) => {
              if (tag.length > 50) {
                validationMessages.push("Tag too long (max 50 characters)");
                status = status === "error" ? "error" : "warning";
              }
            });
          }

          // Validate folder name
          if (csvRow.folder && csvRow.folder.length > 100) {
            validationMessages.push("Folder name too long (max 100 characters)");
            status = status === "error" ? "error" : "warning";
          }

          csvRow.validation = {
            status,
            messages: validationMessages,
          };

          rows.push(csvRow);
        });

        if (results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push(`Row ${error.row}: ${error.message}`);
          });
        }

        resolve({ rows, errors });
      },
      error: (error) => {
        errors.push(error.message);
        resolve({ rows: [], errors });
      },
    });
  });
}

export function validateCsvHeaders(headers: string[], requiredColumns: string[]): {
  valid: boolean;
  missingColumns: string[];
} {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const missingColumns = requiredColumns.filter(
    col => !normalizedHeaders.includes(col.toLowerCase())
  );

  return {
    valid: missingColumns.length === 0,
    missingColumns,
  };
}

export function generateErrorReport(rows: CsvRow[]): string {
  const errorRows = rows.filter(r => r.validation.status === "error" || r.validation.status === "warning");
  
  const csvContent = [
    ["Row Number", "Status", "Destination URL", "Custom Slug", "Issues"].join(","),
    ...errorRows.map((row, index) => [
      index + 1,
      row.validation.status,
      `"${row.destinationUrl}"`,
      row.customSlug || "",
      `"${row.validation.messages.join("; ")}"`,
    ].join(","))
  ].join("\n");

  return csvContent;
}