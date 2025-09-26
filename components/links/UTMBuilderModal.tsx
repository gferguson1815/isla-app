'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Globe, DollarSign, Megaphone, Search, FileText, Gift, ChevronDown, ChevronUp, Link2, Save, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UTMBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (utm: {
    source: string;
    medium: string;
    campaign: string;
    term: string;
    content: string;
    referral: string;
  }) => void;
  initialValues?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    referral?: string;
  };
  destinationUrl?: string;
  workspaceSlug?: string;
  workspaceId?: string;
}

export function UTMBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialValues = {},
  destinationUrl = '',
  workspaceSlug,
  workspaceId
}: UTMBuilderModalProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const utils = api.useContext();

  const [source, setSource] = useState(initialValues.source || '');
  const [medium, setMedium] = useState(initialValues.medium || '');
  const [campaign, setCampaign] = useState(initialValues.campaign || '');
  const [term, setTerm] = useState(initialValues.term || '');
  const [content, setContent] = useState(initialValues.content || '');
  const [referral, setReferral] = useState(initialValues.referral || '');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Fetch templates if workspaceId is provided
  const { data: templates } = api.utmTemplate.list.useQuery(
    { workspaceId: workspaceId || '' },
    { enabled: !!workspaceId }
  );

  // Save template mutation
  const saveTemplateMutation = api.utmTemplate.create.useMutation({
    onSuccess: () => {
      toast.success('Template saved successfully');
      utils.utmTemplate.list.invalidate({ workspaceId: workspaceId || '' });
      setShowSaveTemplate(false);
      setTemplateName('');
      setShowTemplates(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save template');
    }
  });

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      // Check if URL has protocol, if not add https://
      const urlToValidate = url.match(/^https?:\/\//) ? url : `https://${url}`;
      const urlObj = new URL(urlToValidate);
      // Basic validation - must have host and valid protocol
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const hasValidDestinationUrl = isValidUrl(destinationUrl);
  const hasUTMParameters = !!(source || medium || campaign || term || content || referral);

  // Filter templates based on search
  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(templateSearch.toLowerCase())
  ) || [];

  // Apply template to current form
  const applyTemplate = (template: any) => {
    setSource(template.utm_source || '');
    setMedium(template.utm_medium || '');
    setCampaign(template.utm_campaign || '');
    setTerm(template.utm_term || '');
    setContent(template.utm_content || '');
    setReferral(template.referral || '');
    setShowTemplates(false);
    toast.success(`Applied template: ${template.name}`);
  };

  // Save current form as template
  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!workspaceId) {
      toast.error('Workspace ID is required to save templates');
      return;
    }

    saveTemplateMutation.mutate({
      workspaceId,
      name: templateName.trim(),
      description: null,
      utmSource: source || null,
      utmMedium: medium || null,
      utmCampaign: campaign || null,
      utmTerm: term || null,
      utmContent: content || null,
      referral: referral || null,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplates(false);
        setShowSaveTemplate(false);
        setTemplateName('');
        setTemplateSearch('');
      }
    };

    if (showTemplates) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplates]);

  // Reset values only when modal opens (transitions from closed to open)
  useEffect(() => {
    if (isOpen) {
      setSource(initialValues.source || '');
      setMedium(initialValues.medium || '');
      setCampaign(initialValues.campaign || '');
      setTerm(initialValues.term || '');
      setContent(initialValues.content || '');
      setReferral(initialValues.referral || '');
    }
  }, [isOpen]); // Removed initialValues from dependencies to prevent resetting while typing

  const handleSave = () => {
    onSave({
      source,
      medium,
      campaign,
      term,
      content,
      referral,
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial values
    setSource(initialValues.source || '');
    setMedium(initialValues.medium || '');
    setCampaign(initialValues.campaign || '');
    setTerm(initialValues.term || '');
    setContent(initialValues.content || '');
    setReferral(initialValues.referral || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            UTM Builder
            <InfoTooltip
              content="Add UTM parameters to track your marketing campaigns"
              side="right"
            />
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Source */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-gray-900">
            <Label className="flex items-center gap-2 px-3 py-2.5 w-32 border-r border-gray-200 bg-gray-50 rounded-l-lg">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Source</span>
            </Label>
            <input
              type="text"
              placeholder="google"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm placeholder-gray-400 bg-white focus:outline-none rounded-r-lg"
            />
          </div>

          {/* Medium */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-gray-900">
            <Label className="flex items-center gap-2 px-3 py-2.5 w-32 border-r border-gray-200 bg-gray-50 rounded-l-lg">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Medium</span>
            </Label>
            <input
              type="text"
              placeholder="cpc"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm placeholder-gray-400 bg-white focus:outline-none rounded-r-lg"
            />
          </div>

          {/* Campaign */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-gray-900">
            <Label className="flex items-center gap-2 px-3 py-2.5 w-32 border-r border-gray-200 bg-gray-50 rounded-l-lg">
              <Megaphone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Campaign</span>
            </Label>
            <input
              type="text"
              placeholder="summer sale"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm placeholder-gray-400 bg-white focus:outline-none rounded-r-lg"
            />
          </div>

          {/* Term */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-gray-900">
            <Label className="flex items-center gap-2 px-3 py-2.5 w-32 border-r border-gray-200 bg-gray-50 rounded-l-lg">
              <Search className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Term</span>
            </Label>
            <input
              type="text"
              placeholder="running shoes"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm placeholder-gray-400 bg-white focus:outline-none rounded-r-lg"
            />
          </div>

          {/* Content */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-gray-900">
            <Label className="flex items-center gap-2 px-3 py-2.5 w-32 border-r border-gray-200 bg-gray-50 rounded-l-lg">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Content</span>
            </Label>
            <input
              type="text"
              placeholder="logo link"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm placeholder-gray-400 bg-white focus:outline-none rounded-r-lg"
            />
          </div>

          {/* Referral */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-gray-900">
            <Label className="flex items-center gap-2 px-3 py-2.5 w-32 border-r border-gray-200 bg-gray-50 rounded-l-lg">
              <Gift className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Referral</span>
            </Label>
            <input
              type="text"
              placeholder="yoursite.com"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm placeholder-gray-400 bg-white focus:outline-none rounded-r-lg"
            />
          </div>

          {/* URL Preview */}
          {destinationUrl && (
            <div className="mt-6">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                URL Preview
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto">
                <code className="text-xs text-gray-600 break-all">
                  {(() => {
                    let url = destinationUrl;
                    // Ensure URL has protocol
                    if (!url.match(/^https?:\/\//)) {
                      url = `https://${url}`;
                    }

                    // Build UTM parameters
                    const params = [];
                    if (source) params.push(`utm_source=${encodeURIComponent(source)}`);
                    if (medium) params.push(`utm_medium=${encodeURIComponent(medium)}`);
                    if (campaign) params.push(`utm_campaign=${encodeURIComponent(campaign)}`);
                    if (term) params.push(`utm_term=${encodeURIComponent(term)}`);
                    if (content) params.push(`utm_content=${encodeURIComponent(content)}`);
                    if (referral) params.push(`ref=${encodeURIComponent(referral)}`);

                    // Append parameters to URL
                    if (params.length > 0) {
                      const separator = url.includes('?') ? '&' : '?';
                      return `${url}${separator}${params.join('&')}`;
                    }

                    return url;
                  })()}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Templates Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (hasValidDestinationUrl) {
                  setShowTemplates(!showTemplates);
                  setShowSaveTemplate(false);
                  setTemplateSearch('');
                  setTemplateName('');
                }
              }}
              disabled={!hasValidDestinationUrl}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-all ${
                hasValidDestinationUrl
                  ? 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'
                  : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
              }`}
              title={!hasValidDestinationUrl ? "Please enter a valid destination URL to use templates" : ""}
            >
              <FolderOpen className={`h-3.5 w-3.5 ${hasValidDestinationUrl ? 'text-gray-600' : 'text-gray-300'}`} />
              <span>Templates</span>
              {showTemplates ? (
                <ChevronUp className={`h-3.5 w-3.5 ${hasValidDestinationUrl ? 'text-gray-600' : 'text-gray-300'}`} />
              ) : (
                <ChevronDown className={`h-3.5 w-3.5 ${hasValidDestinationUrl ? 'text-gray-600' : 'text-gray-300'}`} />
              )}
            </button>

            {/* Templates Dropdown Menu */}
            {showTemplates && hasValidDestinationUrl && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3">
                  {/* Search Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder={showSaveTemplate ? "Enter template name..." : "Search templates..."}
                      value={showSaveTemplate ? templateName : templateSearch}
                      onChange={(e) => {
                        if (showSaveTemplate) {
                          setTemplateName(e.target.value);
                        } else {
                          setTemplateSearch(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      autoFocus
                    />
                  </div>

                  {showSaveTemplate ? (
                    // Save Template View
                    <div className="space-y-3">
                      <div className="text-xs text-gray-500">Enter a name for your template:</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowSaveTemplate(false);
                            setTemplateName('');
                          }}
                          className="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveAsTemplate}
                          disabled={!templateName.trim()}
                          className="flex-1 px-3 py-2 text-sm text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Templates List View
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {/* Save Current as Template Option - only show if there are UTM parameters */}
                      {hasUTMParameters && (
                        <>
                          <button
                            onClick={() => setShowSaveTemplate(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md"
                          >
                            <Save className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-gray-700">Save current as template</span>
                          </button>
                          {filteredTemplates.length > 0 && (
                            <div className="border-t border-gray-100 my-2"></div>
                          )}
                        </>
                      )}

                      {filteredTemplates.length > 0 &&
                        filteredTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => applyTemplate(template)}
                              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md group"
                            >
                              <span className="text-gray-700">{template.name}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {template.utm_source && <Globe className="h-3 w-3 text-gray-400" />}
                                {template.utm_medium && <DollarSign className="h-3 w-3 text-gray-400" />}
                                {template.utm_campaign && <Megaphone className="h-3 w-3 text-gray-400" />}
                                {template.utm_term && <Search className="h-3 w-3 text-gray-400" />}
                                {template.utm_content && <FileText className="h-3 w-3 text-gray-400" />}
                                {template.referral && <Gift className="h-3 w-3 text-gray-400" />}
                              </div>
                            </button>
                          ))}

                      {filteredTemplates.length === 0 && templateSearch && (
                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                          No templates found matching "{templateSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasValidDestinationUrl}
              className={`h-9 px-4 ${
                hasValidDestinationUrl
                  ? 'bg-black hover:bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={!hasValidDestinationUrl ? "Please enter a valid destination URL before saving UTM parameters" : ""}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}