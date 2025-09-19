import { describe, it, expect } from "vitest";
import { parseCsvFile, validateCsvHeaders, generateErrorReport } from "@/lib/csv-parser";
import type { ColumnMapping } from "@/lib/csv-parser";

describe("CSV Parser", () => {
  describe("parseCsvFile", () => {
    it("should parse valid CSV content", async () => {
      const csvContent = `destination_url,custom_slug,title,tags,folder
https://example.com,promo-2024,Summer Promo,"marketing,summer",campaigns
https://blog.com/post,,Blog Post,"content",blog`;
      
      const file = new File([csvContent], "test.csv", { type: "text/csv" });
      const columnMapping: ColumnMapping = {
        destinationUrl: "destination_url",
        customSlug: "custom_slug",
        title: "title",
        tags: "tags",
        folder: "folder",
      };

      const result = await parseCsvFile(file, columnMapping);

      expect(result.rows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      
      expect(result.rows[0]).toMatchObject({
        destinationUrl: "https://example.com",
        customSlug: "promo-2024",
        title: "Summer Promo",
        tags: ["marketing", "summer"],
        folder: "campaigns",
        validation: {
          status: "valid",
          messages: [],
        },
      });
    });

    it("should validate URL format", async () => {
      const csvContent = `destination_url
invalid-url
https://valid.com`;
      
      const file = new File([csvContent], "test.csv", { type: "text/csv" });
      const columnMapping: ColumnMapping = {
        destinationUrl: "destination_url",
      };

      const result = await parseCsvFile(file, columnMapping);

      expect(result.rows[0].validation.status).toBe("error");
      expect(result.rows[0].validation.messages).toContain("Invalid URL format");
      expect(result.rows[1].validation.status).toBe("valid");
    });

    it("should detect duplicate slugs", async () => {
      const csvContent = `destination_url,custom_slug
https://example1.com,same-slug
https://example2.com,same-slug`;
      
      const file = new File([csvContent], "test.csv", { type: "text/csv" });
      const columnMapping: ColumnMapping = {
        destinationUrl: "destination_url",
        customSlug: "custom_slug",
      };

      const result = await parseCsvFile(file, columnMapping);

      expect(result.rows[0].validation.status).toBe("valid");
      expect(result.rows[1].validation.status).toBe("warning");
      expect(result.rows[1].validation.messages).toContain("Duplicate slug in file");
    });

    it("should validate slug format", async () => {
      const csvContent = `destination_url,custom_slug
https://example.com,valid-slug-123
https://example2.com,invalid slug!
https://example3.com,another_valid`;
      
      const file = new File([csvContent], "test.csv", { type: "text/csv" });
      const columnMapping: ColumnMapping = {
        destinationUrl: "destination_url",
        customSlug: "custom_slug",
      };

      const result = await parseCsvFile(file, columnMapping);

      expect(result.rows[0].validation.status).toBe("valid");
      expect(result.rows[1].validation.status).toBe("error");
      expect(result.rows[1].validation.messages).toContain("Invalid slug format");
      expect(result.rows[2].validation.status).toBe("valid");
    });

    it("should handle missing required fields", async () => {
      const csvContent = `custom_slug,title
test-slug,Test Title`;
      
      const file = new File([csvContent], "test.csv", { type: "text/csv" });
      const columnMapping: ColumnMapping = {
        destinationUrl: "destination_url", // This column doesn't exist
        customSlug: "custom_slug",
        title: "title",
      };

      const result = await parseCsvFile(file, columnMapping);

      expect(result.rows[0].validation.status).toBe("error");
      expect(result.rows[0].validation.messages).toContain("Destination URL is required");
    });

    it("should parse tags correctly", async () => {
      const csvContent = `destination_url,tags
https://example.com,"tag1,tag2,tag3"
https://example2.com,single-tag
https://example3.com,""`;
      
      const file = new File([csvContent], "test.csv", { type: "text/csv" });
      const columnMapping: ColumnMapping = {
        destinationUrl: "destination_url",
        tags: "tags",
      };

      const result = await parseCsvFile(file, columnMapping);

      expect(result.rows[0].tags).toEqual(["tag1", "tag2", "tag3"]);
      expect(result.rows[1].tags).toEqual(["single-tag"]);
      expect(result.rows[2].tags).toBeUndefined();
    });

    it("should limit tags to 10", async () => {
      const tags = Array.from({ length: 15 }, (_, i) => `tag${i + 1}`).join(",");
      const csvContent = `destination_url,tags
https://example.com,"${tags}"`;
      
      const file = new File([csvContent], "test.csv", { type: "text/csv" });
      const columnMapping: ColumnMapping = {
        destinationUrl: "destination_url",
        tags: "tags",
      };

      const result = await parseCsvFile(file, columnMapping);

      expect(result.rows[0].tags).toHaveLength(10);
      expect(result.rows[0].validation.status).toBe("warning");
      expect(result.rows[0].validation.messages).toContain("Too many tags (max 10)");
    });
  });

  describe("validateCsvHeaders", () => {
    it("should validate required headers are present", () => {
      const headers = ["destination_url", "custom_slug", "title"];
      const required = ["destination_url"];
      
      const result = validateCsvHeaders(headers, required);
      
      expect(result.valid).toBe(true);
      expect(result.missingColumns).toHaveLength(0);
    });

    it("should detect missing required headers", () => {
      const headers = ["custom_slug", "title"];
      const required = ["destination_url", "custom_slug"];
      
      const result = validateCsvHeaders(headers, required);
      
      expect(result.valid).toBe(false);
      expect(result.missingColumns).toEqual(["destination_url"]);
    });

    it("should handle case-insensitive header matching", () => {
      const headers = ["DESTINATION_URL", "Custom_Slug"];
      const required = ["destination_url"];
      
      const result = validateCsvHeaders(headers, required);
      
      expect(result.valid).toBe(true);
    });
  });

  describe("generateErrorReport", () => {
    it("should generate CSV error report", () => {
      const rows = [
        {
          destinationUrl: "https://example.com",
          customSlug: "test",
          validation: {
            status: "valid" as const,
            messages: [],
          },
        },
        {
          destinationUrl: "invalid-url",
          customSlug: "test2",
          validation: {
            status: "error" as const,
            messages: ["Invalid URL format"],
          },
        },
        {
          destinationUrl: "https://example2.com",
          customSlug: "test",
          validation: {
            status: "warning" as const,
            messages: ["Duplicate slug"],
          },
        },
      ];

      const report = generateErrorReport(rows);
      const lines = report.split("\n");

      expect(lines).toHaveLength(3); // Header + 2 error rows
      expect(lines[0]).toContain("Row Number,Status,Destination URL,Custom Slug,Issues");
      expect(lines[1]).toContain("error");
      expect(lines[1]).toContain("invalid-url");
      expect(lines[2]).toContain("warning");
    });

    it("should handle multiple error messages", () => {
      const rows = [
        {
          destinationUrl: "invalid",
          customSlug: "bad slug!",
          validation: {
            status: "error" as const,
            messages: ["Invalid URL format", "Invalid slug format"],
          },
        },
      ];

      const report = generateErrorReport(rows);
      const lines = report.split("\n");

      expect(lines[1]).toContain("Invalid URL format; Invalid slug format");
    });
  });
});