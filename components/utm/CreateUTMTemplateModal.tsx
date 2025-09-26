'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Globe, DollarSign, Megaphone, Search, FileText, Gift, ChevronDown, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { api } from '@/utils/api';
import { toast } from 'sonner';

interface CreateUTMTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialValues?: {
    id?: string;
    name?: string;
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    referral?: string;
  };
  workspaceId: string;
  workspaceSlug?: string;
}

export function CreateUTMTemplateModal({
  isOpen,
  onClose,
  onSuccess,
  initialValues = {},
  workspaceId,
  workspaceSlug
}: CreateUTMTemplateModalProps) {
  const router = useRouter();
  const utils = api.useContext();
  const [templateName, setTemplateName] = useState(initialValues.name || '');
  const [source, setSource] = useState(initialValues.source || '');
  const [medium, setMedium] = useState(initialValues.medium || '');
  const [campaign, setCampaign] = useState(initialValues.campaign || '');
  const [term, setTerm] = useState(initialValues.term || '');
  const [content, setContent] = useState(initialValues.content || '');
  const [referral, setReferral] = useState(initialValues.referral || '');
  const [showTemplates, setShowTemplates] = useState(false);

  const createMutation = api.utmTemplate.create.useMutation({
    onSuccess: () => {
      toast.success('UTM template created successfully');
      utils.utmTemplate.list.invalidate({ workspaceId });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create template');
    },
  });

  const updateMutation = api.utmTemplate.update.useMutation({
    onSuccess: () => {
      toast.success('UTM template updated successfully');
      utils.utmTemplate.list.invalidate({ workspaceId });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;
  const isEditing = !!initialValues.id;

  // Reset values only when modal opens (transitions from closed to open)
  useEffect(() => {
    if (isOpen) {
      setTemplateName(initialValues.name || '');
      setSource(initialValues.source || '');
      setMedium(initialValues.medium || '');
      setCampaign(initialValues.campaign || '');
      setTerm(initialValues.term || '');
      setContent(initialValues.content || '');
      setReferral(initialValues.referral || '');
    }
  }, [isOpen]); // Removed initialValues from dependencies to prevent resetting while typing

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const templateData = {
      workspaceId,
      name: templateName.trim(),
      description: null,
      utmSource: source || null,
      utmMedium: medium || null,
      utmCampaign: campaign || null,
      utmTerm: term || null,
      utmContent: content || null,
      referral: referral || null,
    };

    if (isEditing) {
      updateMutation.mutate({
        id: initialValues.id!,
        ...templateData,
      });
    } else {
      createMutation.mutate(templateData);
    }
  };

  const handleCancel = () => {
    // Reset to initial values
    setTemplateName(initialValues.name || '');
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
            {isEditing ? 'Edit' : 'Create'} UTM Template
            <InfoTooltip
              content="Save UTM parameters as a template for quick reuse"
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
          {/* Template Name */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Template Name *
            </Label>
            <input
              type="text"
              placeholder="e.g., Google Ads Campaign"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              autoFocus
            />
          </div>

          <div className="text-xs text-gray-500 mb-3">
            Configure the UTM parameters for this template
          </div>

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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!templateName.trim() || isSubmitting}
            className={`h-9 px-4 gap-2 ${
              templateName.trim() && !isSubmitting
                ? 'bg-black hover:bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={!templateName.trim() ? "Please enter a template name" : ""}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </div>
    </div>
  );
}