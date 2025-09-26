"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (externalId: string, tenantId: string) => void;
  initialExternalId?: string;
  initialTenantId?: string;
}

export function AdvancedSettingsModal({
  isOpen,
  onClose,
  onSave,
  initialExternalId = "",
  initialTenantId = ""
}: AdvancedSettingsModalProps) {
  const [externalId, setExternalId] = useState(initialExternalId);
  const [tenantId, setTenantId] = useState(initialTenantId);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(externalId, tenantId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl z-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Advanced Options</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* External ID */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                External ID
                <InfoTooltip
                  content="A unique identifier from your system to track this link"
                />
              </label>
              <input
                type="text"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="Eg: 123456"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Tenant ID */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Tenant ID
                <InfoTooltip
                  content="The tenant or workspace ID this link belongs to"
                />
              </label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Eg: user_123"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}