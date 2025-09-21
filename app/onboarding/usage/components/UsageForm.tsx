"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

interface UsageFormProps {
  onContinue: (data: {
    linksPerMonth: string;
    clicksPerMonth: string;
    trackConversions: string;
    partnerProgram: string;
  }) => void;
}

export default function UsageForm({ onContinue }: UsageFormProps) {
  const [linksPerMonth, setLinksPerMonth] = useState("1k");
  const [clicksPerMonth, setClicksPerMonth] = useState("50k");
  const [trackConversions, setTrackConversions] = useState("no");
  const [partnerProgram, setPartnerProgram] = useState("no");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({
      linksPerMonth,
      clicksPerMonth,
      trackConversions,
      partnerProgram,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question 1: Links per month */}
      <div className="space-y-3">
        <label id="links-per-month-label" className="block text-[15px] text-gray-700 font-normal">
          How many <span className="underline decoration-dotted decoration-gray-400 underline-offset-4">links</span> do you create per month?
        </label>
        <div
          role="radiogroup"
          aria-labelledby="links-per-month-label"
          aria-required="true"
          className="flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            role="radio"
            aria-checked={linksPerMonth === "1k"}
            aria-label="1,000 links or less per month"
            onClick={() => setLinksPerMonth("1k")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              linksPerMonth === "1k"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            1K or less
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={linksPerMonth === "10k"}
            aria-label="10,000 links per month"
            onClick={() => setLinksPerMonth("10k")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              linksPerMonth === "10k"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            10K
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={linksPerMonth === "50k"}
            aria-label="50,000 links per month"
            onClick={() => setLinksPerMonth("50k")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              linksPerMonth === "50k"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            50K
          </button>
        </div>
      </div>

      {/* Question 2: Clicks per month */}
      <div className="space-y-3">
        <label id="clicks-per-month-label" className="block text-[15px] text-gray-700 font-normal">
          How many <span className="underline decoration-dotted decoration-gray-400 underline-offset-4">clicks</span> do your links get per month?
        </label>
        <div
          role="radiogroup"
          aria-labelledby="clicks-per-month-label"
          aria-required="true"
          className="flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            role="radio"
            aria-checked={clicksPerMonth === "50k"}
            aria-label="50,000 clicks or less per month"
            onClick={() => setClicksPerMonth("50k")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              clicksPerMonth === "50k"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            50K or less
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={clicksPerMonth === "250k"}
            aria-label="250,000 clicks per month"
            onClick={() => setClicksPerMonth("250k")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              clicksPerMonth === "250k"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            250K
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={clicksPerMonth === "1m"}
            aria-label="1 million clicks per month"
            onClick={() => setClicksPerMonth("1m")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              clicksPerMonth === "1m"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            1M
          </button>
        </div>
      </div>

      {/* Question 3: Track conversions */}
      <div className="space-y-3">
        <label id="track-conversions-label" className="block text-[15px] text-gray-700 font-normal">
          Do you want to <span className="underline decoration-dotted decoration-gray-400 underline-offset-4">track conversions</span> on your links?
        </label>
        <div
          role="radiogroup"
          aria-labelledby="track-conversions-label"
          aria-required="true"
          className="flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            role="radio"
            aria-checked={trackConversions === "no"}
            aria-label="No, do not track conversions"
            onClick={() => setTrackConversions("no")}
            className={`flex-1 py-2 px-6 text-sm font-medium rounded-md transition-all ${
              trackConversions === "no"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            No
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={trackConversions === "yes"}
            aria-label="Yes, track conversions"
            onClick={() => setTrackConversions("yes")}
            className={`flex-1 py-2 px-6 text-sm font-medium rounded-md transition-all ${
              trackConversions === "yes"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            Yes
          </button>
        </div>
      </div>

      {/* Question 4: Partner program */}
      <div className="space-y-3">
        <label id="partner-program-label" className="block text-[15px] text-gray-700 font-normal">
          Do you want to create a <span className="underline decoration-dotted decoration-gray-400 underline-offset-4">partner program</span>?
        </label>
        <div
          role="radiogroup"
          aria-labelledby="partner-program-label"
          aria-required="true"
          className="flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            role="radio"
            aria-checked={partnerProgram === "no"}
            aria-label="No, do not create a partner program"
            onClick={() => setPartnerProgram("no")}
            className={`flex-1 py-2 px-6 text-sm font-medium rounded-md transition-all ${
              partnerProgram === "no"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            No
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={partnerProgram === "yes"}
            aria-label="Yes, create a partner program"
            onClick={() => setPartnerProgram("yes")}
            className={`flex-1 py-2 px-6 text-sm font-medium rounded-md transition-all ${
              partnerProgram === "yes"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50/50"
            }`}
          >
            Yes
          </button>
        </div>
      </div>

      {/* Continue button and Enterprise link */}
      <div className="pt-2 space-y-3">
        <Button
          type="submit"
          className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-[15px] font-medium rounded-lg transition-colors"
        >
          Continue
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-500">
            Need more usage?{" "}
            <a
              href="/contact/sales"
              className="inline-flex items-center gap-0.5 text-gray-700 hover:text-gray-900 transition-colors group"
            >
              Chat with us about Enterprise
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </span>
        </div>
      </div>
    </form>
  );
}