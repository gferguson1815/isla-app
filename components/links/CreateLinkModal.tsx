"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAutoSaveDraft } from "@/hooks/useAutoSaveDraft";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { generateLinkAvatar } from "@/lib/utils/avatar";
import {
  X,
  Link,
  Globe,
  Folder,
  Shuffle,
  DollarSign,
  Target,
  Lock,
  Clock,
  MoreHorizontal,
  Image,
  Edit2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Calendar,
  Smartphone,
  MapPin,
  Check,
  FolderPlus,
  Search,
  Crown,
  Plus,
  Tag,
  Fingerprint,
  Milestone,
  Shield,
  FileSearch,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeatureGate } from "@/components/ui/feature-gate";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Backdrop } from "@/components/ui/modal-overlay";
import { QRCodeDisplay, QRCodeEditor } from "@/components/ui/qr-code";
import { FlickeringGrid } from "@/src/components/ui/shadcn-io/flickering-grid";
import { XIcon, LinkedInIcon, FacebookIcon, WebIcon } from "@/components/ui/social-icons";
import { LinkPreviewEditor } from "@/components/links/LinkPreviewEditor";
import { UTMBuilderModal } from "@/components/links/UTMBuilderModal";
import { TargetingModal } from "@/components/links/TargetingModal";
import { PasswordModal } from "@/components/links/PasswordModal";
import { LinkExpirationModal } from "@/components/links/LinkExpirationModal";
import { AdvancedSettingsModal } from "@/components/links/AdvancedSettingsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceSlug?: string;
}

// Generate random short link code - only on client side
const generateShortLinkCode = () => {
  // Only generate on client side to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return '';
  }
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function CreateLinkModal({ isOpen, onClose, workspaceId, workspaceSlug }: CreateLinkModalProps) {
  const router = useRouter();
  const utils = api.useContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<{ id: string | null; name: string }>({ id: null, name: 'Links' });
  const [showQREditor, setShowQREditor] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [qrOptions, setQrOptions] = useState({
    backgroundColor: '#FFFFFF',
    foregroundColor: '#000000',
    logo: '/images/logos/isla-icon-black.svg' as string | undefined,
  });
  const [customLinkPreviewEnabled, setCustomLinkPreviewEnabled] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showConversionUpgradePrompt, setShowConversionUpgradePrompt] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<'web' | 'twitter' | 'linkedin' | 'facebook'>('web');
  const [showLinkPreviewEditor, setShowLinkPreviewEditor] = useState(false);
  const [showUTMBuilder, setShowUTMBuilder] = useState(false);
  const [showTargeting, setShowTargeting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [showExpiration, setShowExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [expirationUrl, setExpirationUrl] = useState("");
  const [linkCloakingEnabled, setLinkCloakingEnabled] = useState(false);
  const [searchEngineIndexingEnabled, setSearchEngineIndexingEnabled] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [externalId, setExternalId] = useState("");
  const [tenantId, setTenantId] = useState("");

  // Use a ref to store the generated slug to prevent regeneration
  const generatedSlugRef = useRef<string>("");

  const [destinationUrl, setDestinationUrl] = useState("");
  const [shortLink, setShortLink] = useState(""); // Initialize as empty, will be set in useEffect
  const [domain, setDomain] = useState("isla.sh");
  const [folderId, setFolderId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  // Temporary preview values (not saved to database)
  const [tempTitle, setTempTitle] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [tempImage, setTempImage] = useState("");
  // Track if temp values have been initialized
  const [tempInitialized, setTempInitialized] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [clickLimit, setClickLimit] = useState<number | undefined>();
  const [iosUrl, setIosUrl] = useState("");
  const [androidUrl, setAndroidUrl] = useState("");
  const [geoTargeting, setGeoTargeting] = useState({});
  const [conversionTrackingEnabled, setConversionTrackingEnabled] = useState(false);
  const [deviceTargeting, setDeviceTargeting] = useState({});
  const [conversionTracking, setConversionTracking] = useState({});

  const [showDrafts, setShowDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  const [linkId, setLinkId] = useState<string>("");
  const [linkAvatar, setLinkAvatar] = useState<string>("");

  // Track initial values to detect user changes
  const [initialValues, setInitialValues] = useState<any>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to get time ago string
  const getTimeAgo = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  // Temporary: Get drafts from localStorage
  const [drafts, setDrafts] = useState<any[]>([]);

  const refetchDrafts = useCallback(() => {
    // Check localStorage for any saved drafts
    const savedDraft = localStorage.getItem(`link_draft_${workspaceId}_new`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Build the short link display using saved slug
        const displaySlug = draft.slug || draft.shortLink || 'untitled';
        const displayDomain = draft.domain || 'isla.sh';
        const displayUrl = `${displayDomain}/${displaySlug}`;

        setDrafts([{
          id: 'local-draft',
          url: displayUrl,
          timeAgo: draft.savedAt ? getTimeAgo(draft.savedAt) : 'Recently'
        }]);
      } catch (e) {
        console.error('Failed to parse draft:', e);
      }
    } else {
      setDrafts([]);
    }
  }, [workspaceId]);

  // Save draft mutation
  const saveDraftMutation = api.linkDrafts.save.useMutation({
    onSuccess: (response) => {
      if (!currentDraftId && response?.id) {
        setCurrentDraftId(response.id);
      }
      refetchDrafts();
    },
  });

  // Delete draft mutation
  const deleteDraftMutation = api.linkDrafts.delete.useMutation({
    onSuccess: () => {
      refetchDrafts();
    },
  });

  // Create link mutation
  const createLinkMutation = api.link.create.useMutation({
    onSuccess: () => {
      // Clear the draft after successful link creation
      if (currentDraftId) {
        deleteDraftMutation.mutate({ id: currentDraftId });
      }
      // Reset form
      setDestinationUrl("");
      setShortLink(generateShortLinkCode());
      setTags([]);
      setComments("");
      setQrOptions({
        backgroundColor: '#FFFFFF',
        foregroundColor: '#000000',
        logo: '/images/logos/isla-icon-black.svg',
      });
      // Invalidate related queries to refresh the data
      utils.usage.getMetrics.invalidate({ workspaceId });
      utils.link.list.invalidate({ workspaceId });
      // Close modal and refresh
      onClose();
      router.refresh();
    },
    onError: (error) => {
      console.error('Failed to create link:', error);
      // You might want to show an error toast here
    },
  });

  // Get draft query (not mutation)
  const { mutateAsync: getDraft } = api.linkDrafts.get.useMutation();

  // Fetch folders for the workspace
  const { data: foldersData } = api.folder.list.useQuery(
    { workspace_id: workspaceId },
    { enabled: !!workspaceId }
  );

  // Fetch tags for the workspace
  const { data: tagsData } = api.tag.list.useQuery(
    { workspaceId },
    { enabled: !!workspaceId }
  );

  // Get all folders, sorted by most recent first
  const allFolders = foldersData?.folders || [];

  // Get all tags
  const allTags = tagsData || [];

  // Filter tags based on search
  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Toggle tag selection
  const toggleTag = (tagName: string) => {
    setTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  // Filter folders based on search (search through ALL folders)
  let filteredFolders = folderSearch
    ? allFolders.filter(folder =>
        folder.name.toLowerCase().includes(folderSearch.toLowerCase())
      )
    : allFolders;

  // Limit to 10 folders when not searching
  if (!folderSearch && filteredFolders.length > 10) {
    filteredFolders = filteredFolders.slice(0, 10);
  }

  // Form data object for autosave
  const formData = {
    destinationUrl,
    slug: shortLink,
    domain,
    folderId,
    title,
    description,
    image,
    tags,
    comments,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    password,
    expiresAt,
    clickLimit,
    iosUrl,
    androidUrl,
    geoTargeting,
    deviceTargeting,
    qrCodeSettings: qrOptions,
    conversionTracking,
    linkId,
    linkAvatar,
  };

  // Use autosave hook with localStorage only for now
  const { savedAt, isSaving } = useAutoSaveDraft(
    formData,
    {
      workspaceId,
      draftId: currentDraftId,
      enabled: isOpen && !!workspaceId && isInitialized && !!shortLink,
      initialValues,
      // Comment out API call for now to avoid infinite loop
      // onSaveSuccess: async (data) => {
      //   try {
      //     const response = await saveDraftMutation.mutateAsync({
      //       draftId: currentDraftId,
      //       workspaceId,
      //       data: formData,
      //     });
      //     if (!currentDraftId && response?.id) {
      //       setCurrentDraftId(response.id);
      //     }
      //   } catch (error) {
      //     console.error('Failed to save draft to API:', error);
      //   }
      // },
    }
  );

  // Generate slug once when modal opens
  useEffect(() => {
    if (isOpen && !generatedSlugRef.current) {
      // Generate slug only once per modal session
      generatedSlugRef.current = generateShortLinkCode() || 'temp' + Date.now().toString(36);
    } else if (!isOpen) {
      // Clear the ref when modal closes
      generatedSlugRef.current = "";
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Modal closed, mark as not initialized
      setIsInitialized(false);
      return;
    }

    // Wait for slug to be generated
    if (!generatedSlugRef.current) {
      return;
    }

    // Modal is open and slug is ready, reset everything
    // Mark as not initialized first
    setIsInitialized(false);

    // Clear localStorage draft when opening modal fresh
    localStorage.removeItem(`link_draft_${workspaceId}_new`);

    const newShortLink = generatedSlugRef.current;

    // Reset form to initial state - all empty/default values
    // Mark slug as auto-generated so autosave knows not to trigger on it alone
    const newInitialValues = {
      destinationUrl: "",
      slug: newShortLink, // This is auto-generated, not user input
      domain: "isla.sh",
      folderId: undefined,
      title: "",
      description: "",
      image: "",
      tags: [],
      comments: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmTerm: "",
      utmContent: "",
      password: "",
      expiresAt: undefined,
      clickLimit: undefined,
      iosUrl: "",
      androidUrl: "",
      geoTargeting: {},
      deviceTargeting: {},
      qrCodeSettings: {
        backgroundColor: '#FFFFFF',
        foregroundColor: '#000000',
        logo: '/images/logos/isla-icon-black.svg',
      },
      conversionTracking: {},
    };

    // Generate a unique link ID and avatar for this session
    const newLinkId = crypto.randomUUID();
    setLinkId(newLinkId);
    setLinkAvatar(generateLinkAvatar(newLinkId));

    // Set all states to match initial values
    setDestinationUrl("");
    setShortLink(newShortLink);
    setDomain("isla.sh");
    setFolderId(undefined);
    setTitle("");
    setDescription("");
    setImage("");
    setTags([]);
    setComments("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setUtmTerm("");
    setUtmContent("");
    setPassword("");
    setExpiresAt(undefined);
    setClickLimit(undefined);
    setIosUrl("");
    setAndroidUrl("");
    setGeoTargeting({});
    setDeviceTargeting({});
    setQrOptions({
      backgroundColor: '#FFFFFF',
      foregroundColor: '#000000',
      logo: '/images/logos/isla-icon-black.svg',
    });
    setConversionTracking({});
    setCurrentDraftId(undefined);
    setDrafts([]);
    setInitialValues(newInitialValues);

    // Mark as initialized after a small delay
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, workspaceId]);

  // Update drafts list when autosave occurs
  useEffect(() => {
    if (savedAt) {
      refetchDrafts();
    }
  }, [savedAt, refetchDrafts]);

  // Handle draft restoration
  const handleRestoreDraft = useCallback(async (draftId: string) => {
    try {
      // Temporary: Restore from localStorage
      const savedDraft = localStorage.getItem(`link_draft_${workspaceId}_new`);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setDestinationUrl(draft.destinationUrl || "");
        // Keep existing slug from draft, or keep the current generated one
        if (draft.slug) {
          setShortLink(draft.slug);
        }
        setDomain(draft.domain || "isla.sh");
        setFolderId(draft.folderId || undefined);
        setTitle(draft.title || "");
        setDescription(draft.description || "");
        setImage(draft.image || "");
        setTags(draft.tags || []);
        setComments(draft.comments || "");
        setUtmSource(draft.utmSource || "");
        setUtmMedium(draft.utmMedium || "");
        setUtmCampaign(draft.utmCampaign || "");
        setUtmTerm(draft.utmTerm || "");
        setUtmContent(draft.utmContent || "");
        setPassword(draft.password || "");
        setExpiresAt(draft.expiresAt || undefined);
        setClickLimit(draft.clickLimit || undefined);
        setIosUrl(draft.iosUrl || "");
        setAndroidUrl(draft.androidUrl || "");
        setGeoTargeting(draft.geoTargeting || {});
        setDeviceTargeting(draft.deviceTargeting || {});
        setQrOptions(draft.qrCodeSettings || {
          backgroundColor: '#FFFFFF',
          foregroundColor: '#000000',
          logo: '/images/logos/isla-icon-black.svg',
        });
        setConversionTracking(draft.conversionTracking || {});

        // Restore or generate link ID and avatar
        if (draft.linkId && draft.linkAvatar) {
          setLinkId(draft.linkId);
          setLinkAvatar(draft.linkAvatar);
        } else {
          // Generate new ones if not in draft
          const newLinkId = crypto.randomUUID();
          setLinkId(newLinkId);
          setLinkAvatar(generateLinkAvatar(newLinkId));
        }

        setShowDrafts(false);
      }
    } catch (error) {
      console.error("Failed to restore draft:", error);
    }
  }, [workspaceId]);

  // Handle draft deletion
  const handleDeleteDraft = useCallback(async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftToDelete(draftId);
    setShowDeleteConfirm(true);
  }, []);

  // Confirm draft deletion
  const confirmDeleteDraft = useCallback(() => {
    if (!draftToDelete) return;

    try {
      // Temporary: Delete from localStorage
      localStorage.removeItem(`link_draft_${workspaceId}_new`);
      refetchDrafts();
      setShowDeleteConfirm(false);
      setDraftToDelete(null);
      // Close modal and redirect to links page
      onClose();
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  }, [workspaceId, refetchDrafts, draftToDelete, onClose]);

  // Handle ESC key to close modal and click outside for drafts
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDrafts) {
          setShowDrafts(false);
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.drafts-dropdown') && !target.closest('.drafts-button')) {
        setShowDrafts(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, showDrafts]);

  if (!isOpen) return null;

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Draft?
                </h3>

                {/* Message */}
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete this draft? This action cannot be undone.
                </p>

                {/* Buttons */}
                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDraftToDelete(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={confirmDeleteDraft}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Backdrop - using consistent global styling */}
      <Backdrop onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-5xl bg-white rounded-2xl shadow-[0_25px_80px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <span>Links</span>
                <span className="text-gray-500">›</span>
                <div className="flex items-center gap-1.5">
                  {linkAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={linkAvatar}
                      alt=""
                      className="h-4 w-4 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const globe = document.createElement('div');
                        globe.className = 'h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500';
                        e.currentTarget.parentElement?.insertBefore(globe, e.currentTarget);
                      }}
                    />
                  ) : (
                    <Globe className="h-4 w-4 text-gray-600" />
                  )}
                  <span>New link</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <button
                    onClick={() => setShowDrafts(!showDrafts)}
                    className="drafts-button flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 px-2 py-1 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {savedAt && drafts.length > 0 ? (
                      <>
                        <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Draft saved</span>
                      </>
                    ) : (
                      <span>Drafts</span>
                    )}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDrafts ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Drafts dropdown menu */}
                  {showDrafts && (
                    <div className="drafts-dropdown absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500">
                        Restore drafts
                      </div>
                      {drafts.length > 0 ? (
                        drafts.map((draft) => (
                          <div
                            key={draft.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group cursor-pointer"
                            onClick={() => handleRestoreDraft(draft.id)}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-sm text-gray-900">{draft.url}</span>
                              <span className="text-xs text-gray-500 ml-auto mr-2">{draft.timeAgo}</span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteDraft(draft.id, e)}
                              className="p-0.5 hover:bg-gray-100 rounded transition-all"
                            >
                              <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No drafts available
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content - more breathing room */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-[1.8fr_1fr] gap-8">
                {/* Left Column - Form */}
                <div className="space-y-5">
                  {/* Destination URL */}
                  <div>
                    <Label htmlFor="destination" className="text-sm font-medium text-gray-900 mb-1.5 flex items-center gap-1.5">
                      Destination URL
                      <InfoTooltip
                        align="center"
                        content={
                          <div className="text-center">
                            The URL your users will get redirected to when they visit your short link.{" "}
                            <a
                              href="https://isla.so/help/article/how-to-create-link"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-medium text-gray-900 hover:text-gray-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Learn more.
                            </a>
                          </div>
                        }
                      />
                    </Label>
                    <Input
                      id="destination"
                      type="text"
                      placeholder="isla.so/help/article/what-is-isla"
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      onBlur={(e) => {
                        // Add https:// if no protocol is specified
                        const value = e.target.value.trim();
                        if (value && !value.match(/^https?:\/\//i)) {
                          setDestinationUrl(`https://${value}`);
                        }
                      }}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Short Link */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="shortlink" className="text-sm font-medium text-gray-900">
                        Short Link
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              const newSlug = generateShortLinkCode() || 'temp' + Date.now().toString(36);
                              setShortLink(newSlug);
                            }}
                            type="button"
                            className="p-1 -m-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200 active:scale-95"
                            aria-label="Generate random slug"
                          >
                            <Shuffle className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="end">
                          Generate a random key
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={domain} onValueChange={setDomain}>
                        <SelectTrigger className="w-28 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="isla.sh">isla.sh</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-gray-400 text-sm">/</span>
                      <Input
                        id="shortlink"
                        type="text"
                        placeholder="fNE6Uu0"
                        value={shortLink}
                        onChange={(e) => setShortLink(e.target.value)}
                        className="flex-1 h-9 text-sm"
                      />
                    </div>
                    {/* Free domain notice - Temporarily commented out
                    <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                      <div className="h-3.5 w-3.5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <DollarSign className="h-2 w-2 text-white" />
                      </div>
                      <p className="text-xs text-gray-700 flex-1">
                        Claim a free .link domain, free for 1 year. <a href="#" className="underline font-medium text-blue-600 hover:text-blue-700">Learn more</a>
                      </p>
                      <button className="text-gray-400 hover:text-gray-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    */}
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        Tags
                        <InfoTooltip
                          align="center"
                          content={
                            <div className="text-center">
                              Tags are used to organize your links in your Isla dashboard.{" "}
                              <a
                                href="https://isla.so/help/article/how-to-use-tags"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium text-gray-900 hover:text-gray-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Learn more.
                              </a>
                            </div>
                          }
                        />
                      </Label>
                      <NextLink
                        href={`/${workspaceSlug || workspaceId}/links/tags`}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Manage
                      </NextLink>
                    </div>
                    <DropdownMenu open={tagDropdownOpen} onOpenChange={setTagDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <button className="relative w-full text-left">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                          <div className="min-h-[36px] w-full border border-gray-300 rounded-md pl-10 pr-3 py-1.5 bg-white cursor-pointer flex items-center flex-wrap gap-1">
                            {tags.length > 0 ? (
                              tags.map(tagName => {
                                const tagData = allTags.find(t => t.name === tagName);
                                return (
                                  <span
                                    key={tagName}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border"
                                    style={{
                                      backgroundColor: tagData?.color ? `${tagData.color}15` : '#F59E0B15',
                                      borderColor: tagData?.color ? `${tagData.color}40` : '#F59E0B40',
                                      color: tagData?.color || '#F59E0B'
                                    }}
                                  >
                                    {tagName.charAt(0).toUpperCase() + tagName.slice(1)}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-sm text-gray-400">Select tags...</span>
                            )}
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-full max-h-[300px] overflow-y-auto p-2" style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}>
                        {/* Search input */}
                        <div className="mb-2">
                          <Input
                            type="text"
                            placeholder="Search or add tags..."
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Tag list */}
                        <div className="space-y-1">
                          {filteredTags.length > 0 ? (
                            filteredTags.map((tag) => (
                              <div
                                key={tag.id}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleTag(tag.name);
                                }}
                              >
                                <Checkbox
                                  checked={tags.includes(tag.name)}
                                  onCheckedChange={(checked) => {
                                    toggleTag(tag.name);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4"
                                />
                                <div className="flex items-center gap-2 flex-1">
                                  <div
                                    className="w-5 h-5 rounded-md flex items-center justify-center border"
                                    style={{
                                      backgroundColor: tag.color ? `${tag.color}15` : '#F59E0B15',
                                      borderColor: tag.color ? `${tag.color}40` : '#F59E0B40'
                                    }}
                                  >
                                    <Tag className="h-3 w-3" style={{ color: tag.color || '#F59E0B' }} />
                                  </div>
                                  <span className="text-sm">
                                    {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : tagSearch ? (
                            <div className="p-2 text-sm text-gray-500">
                              Press Enter to create "{tagSearch}"
                            </div>
                          ) : (
                            <div className="p-2 text-sm text-gray-500">
                              No tags found
                            </div>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Comments */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-1.5 flex items-center gap-1.5">
                      Comments
                      <InfoTooltip
                        align="center"
                        content={
                          <div className="text-center">
                            Use comments to add context to your short links – for you and your team.{" "}
                            <a
                              href="https://isla.so/help/article/link-comments"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-medium text-gray-900 hover:text-gray-700"
                            >
                              Learn more.
                            </a>
                          </div>
                        }
                      />
                    </Label>
                    <Textarea
                      placeholder="Add comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                    />
                  </div>

                  {/* Conversion Tracking */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        Conversion Tracking
                        <InfoTooltip
                          align="center"
                          content={
                            <div className="text-center">
                              View analytics on conversions from your short links.{" "}
                              <a
                                href="https://isla.so/docs/conversions/quickstart"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium text-gray-900 hover:text-gray-700"
                              >
                                Learn more.
                              </a>
                            </div>
                          }
                        />
                      </Label>
                      <FeatureGate
                        featureKey="conversion_tracking"
                        workspaceId={workspaceId}
                        fallback="custom"
                        customFallback={
                          <button
                            type="button"
                            onClick={() => setShowConversionUpgradePrompt(!showConversionUpgradePrompt)}
                            className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            aria-label="Toggle Conversion Tracking"
                          >
                            <span className="inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow transition-transform translate-x-0.5">
                              <Crown className="h-2.5 w-2.5 text-gray-600" />
                            </span>
                          </button>
                        }
                      >
                        <Switch
                          checked={conversionTrackingEnabled}
                          onCheckedChange={setConversionTrackingEnabled}
                        />
                      </FeatureGate>
                    </div>
                    {showConversionUpgradePrompt && (
                      <div className="rounded-lg px-4 py-3 bg-gray-50">
                        <p className="text-sm text-gray-900 text-center mb-3">
                          Conversion tracking is available on<br />the Business plan and above.
                        </p>
                        <Button
                          className="w-full bg-black hover:bg-gray-800 text-white"
                          onClick={() => {
                            // TODO: Navigate to upgrade page
                            window.location.href = '/billing/upgrade';
                          }}
                        >
                          Upgrade to Business
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="relative">
                  {/* Container with gradient background */}
                  <div className="relative bg-gradient-to-b from-gray-50 to-white rounded-xl overflow-hidden">
                    {/* Border overlay with mask gradient */}
                    <div
                      className="absolute inset-0 rounded-xl border border-gray-200 pointer-events-none"
                      style={{
                        maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)'
                      }}
                    ></div>

                    {/* Content container */}
                    <div className="relative p-5 space-y-5">
                  {/* Folder */}
                  <div className="pb-3 border-b border-gray-200">
                    <Label className="text-sm font-medium text-gray-900 mb-1.5 flex items-center gap-1.5">
                      Folder
                      <InfoTooltip
                        align="center"
                        content={
                          <div className="text-center">
                            Use folders to organize and manage access to your links.{" "}
                            <a
                              href="https://isla.so/help/article/link-folders"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-medium text-gray-900 hover:text-gray-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Learn more
                            </a>
                          </div>
                        }
                      />
                    </Label>
                    <div className="relative mt-2">
                      <button
                        onClick={() => setFolderDropdownOpen(!folderDropdownOpen)}
                        className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Folder className={`h-3.5 w-3.5 ${selectedFolder.id === null ? 'text-green-600' : 'text-gray-500'}`} />
                          <span className="font-medium text-gray-900">{selectedFolder.name}</span>
                        </div>
                        <div className="flex flex-col -space-y-1">
                          <ChevronDown className="h-3 w-3 text-gray-400 rotate-180" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </button>

                      {/* Dropdown Menu */}
                      {folderDropdownOpen && (
                        <div className="absolute top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                          {/* Search Input - always visible */}
                          <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search folders..."
                                value={folderSearch}
                                onChange={(e) => setFolderSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          {/* Folder List */}
                          <div className="py-1 max-h-64 overflow-y-auto">
                            {/* Links (root level) */}
                            <button
                              onClick={() => {
                                setSelectedFolder({ id: null, name: 'Links' });
                                setFolderId(undefined);
                                setFolderDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className="h-3.5 w-3.5 text-green-600" />
                                <span className="font-medium">Links</span>
                              </div>
                              {selectedFolder.id === null && (
                                <Check className="h-3.5 w-3.5 text-gray-900" />
                              )}
                            </button>

                            {/* User folders */}
                            {filteredFolders.map((folder) => (
                              <button
                                key={folder.id}
                                onClick={() => {
                                  setSelectedFolder({ id: folder.id, name: folder.name });
                                  setFolderId(folder.id);
                                  setFolderDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-2">
                                  <Folder className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="font-medium">{folder.name}</span>
                                </div>
                                {selectedFolder.id === folder.id && (
                                  <Check className="h-3.5 w-3.5 text-gray-900" />
                                )}
                              </button>
                            ))}

                            {/* No folders found */}
                            {folderSearch && filteredFolders.length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No folders found
                              </div>
                            )}

                            {/* Indicator when folders are truncated */}
                            {!folderSearch && allFolders.length > 10 && (
                              <div className="px-3 py-2 text-xs text-gray-500 italic">
                                {allFolders.length - 10} more folder{allFolders.length - 10 > 1 ? 's' : ''} available. Use search to find them.
                              </div>
                            )}
                          </div>

                          {/* Create New Folder / Upgrade Prompt */}
                          <div className="border-t border-gray-100">
                            <FeatureGate
                              featureKey="folders"
                              workspaceId={workspaceId}
                              fallback="custom"
                              customFallback={
                                <div className="p-3 space-y-3">
                                  {/* Upgrade message */}
                                  <div className="text-center py-2">
                                    <p className="text-sm text-gray-600">
                                      You can only use Link Folders on a Pro plan and above. Upgrade to Pro to continue.
                                    </p>
                                  </div>

                                  {/* Upgrade button */}
                                  <button
                                    onClick={() => {
                                      // TODO: Navigate to upgrade page
                                      window.location.href = '/upgrade';
                                    }}
                                    className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                                  >
                                    Upgrade to Pro
                                  </button>

                                  {/* Disabled create folder option */}
                                  <button
                                    disabled
                                    className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 text-gray-400 cursor-not-allowed opacity-60"
                                  >
                                    <FolderPlus className="h-3.5 w-3.5" />
                                    <span>Create new folder</span>
                                  </button>
                                </div>
                              }
                            >
                              <div className="p-2">
                                <button
                                  onClick={() => {
                                    // TODO: Implement create folder functionality
                                    setFolderDropdownOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                                >
                                  <FolderPlus className="h-3.5 w-3.5" />
                                  <span>Create new folder</span>
                                </button>
                              </div>
                            </FeatureGate>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-1.5 flex items-center gap-1.5">
                      QR Code
                      <InfoTooltip
                        align="center"
                        content={
                          <div className="text-center">
                            Set a custom QR code design to improve click-through rates.{" "}
                            <a
                              href="https://isla.so/help/article/custom-qr-codes"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-medium text-gray-900 hover:text-gray-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Learn more.
                            </a>
                          </div>
                        }
                      />
                    </Label>
                    <QRCodeDisplay
                      url={shortLink ? `https://${domain}/${shortLink}` : ''}
                      size={80}
                      onEdit={() => setShowQREditor(true)}
                      backgroundColor={qrOptions.backgroundColor}
                      foregroundColor={qrOptions.foregroundColor}
                      logo={qrOptions.logo}
                    />
                  </div>

                  {/* Custom Link Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        Custom Link Preview
                        <InfoTooltip
                          align="center"
                          content={
                            <div className="text-center">
                              Customize how your links look when shared on social media to improve click-through rates. When enabled, the preview settings below will be shown publicly (instead of the URL's original metatags).{" "}
                              <a
                                href="https://isla.so/help/article/custom-link-previews"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium text-gray-900 hover:text-gray-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Learn more.
                              </a>
                            </div>
                          }
                        />
                      </Label>
                      <FeatureGate
                        featureKey="custom-link-preview"
                        workspaceId={workspaceId}
                        fallback="custom"
                        customFallback={
                          <button
                            type="button"
                            onClick={() => setShowUpgradePrompt(!showUpgradePrompt)}
                            className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            aria-label="Toggle Custom Link Preview"
                          >
                            <span className="inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow transition-transform translate-x-0.5">
                              <Crown className="h-2.5 w-2.5 text-gray-600" />
                            </span>
                          </button>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setCustomLinkPreviewEnabled(!customLinkPreviewEnabled)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                            customLinkPreviewEnabled ? 'bg-black' : 'bg-gray-200'
                          }`}
                          aria-label="Toggle Custom Link Preview"
                        >
                          <span className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow transition-transform ${
                            customLinkPreviewEnabled ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </FeatureGate>
                    </div>
                    {showUpgradePrompt ? (
                      <div className="rounded-lg px-4 py-3 bg-gray-50 mb-3">
                        <p className="text-sm text-gray-900 text-center mb-3">
                          Custom Link Previews are only available on<br />the Pro plan and above.
                        </p>
                        <Button
                          className="w-full bg-black hover:bg-gray-800 text-white"
                          onClick={() => {
                            // TODO: Navigate to upgrade page
                            window.location.href = '/billing/upgrade';
                          }}
                        >
                          Upgrade to Pro
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Social Media Preview Selector */}
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => setPreviewPlatform('web')}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors ${
                              previewPlatform === 'web'
                                ? 'bg-gray-100 border border-gray-300'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <WebIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewPlatform('twitter')}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors ${
                              previewPlatform === 'twitter'
                                ? 'bg-gray-100 border border-gray-300'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <XIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewPlatform('linkedin')}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors ${
                              previewPlatform === 'linkedin'
                                ? 'bg-gray-100 border border-gray-300'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <LinkedInIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewPlatform('facebook')}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors ${
                              previewPlatform === 'facebook'
                                ? 'bg-gray-100 border border-gray-300'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <FacebookIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="bg-white rounded-lg">
                          <div className="relative overflow-hidden">
                            {/* Edit button as badge in top-right corner */}
                            <button
                              onClick={() => setShowLinkPreviewEditor(true)}
                              type="button"
                              className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all"
                              aria-label="Edit Link Preview"
                            >
                              <Pencil className="h-3.5 w-3.5 text-gray-600" />
                            </button>

                            {(tempInitialized ? (tempImage || tempTitle || tempDescription) : (image || title || description)) ? (
                              <div className="w-full">
                                {/* Different layouts based on platform */}
                                {previewPlatform === 'web' && (
                                  <>
                                    {/* Web Preview - Standard Open Graph */}
                                    {(tempInitialized ? tempImage : image) && (
                                      <div className="w-full rounded-lg overflow-hidden" style={{ aspectRatio: '1200 / 630' }}>
                                        <img
                                          src={tempInitialized ? tempImage : image}
                                          alt="Link preview"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="pt-2 pb-3 bg-white">
                                      {(tempInitialized ? tempTitle : title) && (
                                        <p className="text-sm text-gray-900 line-clamp-1 mb-1">
                                          {tempInitialized ? tempTitle : title}
                                        </p>
                                      )}
                                      {(tempInitialized ? tempDescription : description) && (
                                        <p className="text-xs text-gray-600 line-clamp-2">
                                          {tempInitialized ? tempDescription : description}
                                        </p>
                                      )}
                                    </div>
                                  </>
                                )}

                                {previewPlatform === 'twitter' && (
                                  <>
                                    {/* Twitter/X Card Preview - Image with text badge */}
                                    <div>
                                      <div className="relative rounded-2xl overflow-hidden">
                                        {(tempInitialized ? tempImage : image) ? (
                                          <>
                                            <div className="w-full" style={{ aspectRatio: '1.91 / 1' }}>
                                              <img
                                                src={tempInitialized ? tempImage : image}
                                                alt="Link preview"
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                            {/* Text badge overlay at bottom left */}
                                            {(tempInitialized ? tempTitle : title) && (
                                              <div className="absolute bottom-2.5 left-2.5">
                                                <div className="bg-black/80 backdrop-blur-sm rounded-md px-2.5 py-1.5">
                                                  <p className="text-xs font-semibold text-white line-clamp-1">
                                                    {tempInitialized ? tempTitle : title}
                                                  </p>
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-100">
                                            <Image className="h-8 w-8 text-gray-400 mb-3" />
                                            <p className="text-xs text-gray-600 text-center">
                                              Add an image to preview
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      {/* Domain below the card */}
                                      <p className="text-xs text-gray-500 mt-2">
                                        From {domain || 'isla.so'}
                                      </p>
                                    </div>
                                  </>
                                )}

                                {previewPlatform === 'linkedin' && (
                                  <>
                                    {/* LinkedIn Preview - Horizontal layout */}
                                    <div className="rounded-lg border border-gray-200 overflow-hidden flex bg-white">
                                      {/* Image on the left with padding - wider and shorter */}
                                      {(tempInitialized ? tempImage : image) && (
                                        <div className="p-2 flex-shrink-0">
                                          <div className="w-[140px] h-[80px] rounded overflow-hidden">
                                            <img
                                              src={tempInitialized ? tempImage : image}
                                              alt="Link preview"
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        </div>
                                      )}
                                      {/* Text on the right */}
                                      <div className="flex-1 py-3 pr-3 flex flex-col justify-center">
                                        {(tempInitialized ? tempTitle : title) && (
                                          <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                                            {tempInitialized ? tempTitle : title}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                          {domain || 'isla.so'}
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {previewPlatform === 'facebook' && (
                                  <>
                                    {/* Facebook Preview - No rounded corners */}
                                    <div className="border border-gray-300 overflow-hidden">
                                      {(tempInitialized ? tempImage : image) && (
                                        <div className="w-full" style={{ aspectRatio: '1.91 / 1' }}>
                                          <img
                                            src={tempInitialized ? tempImage : image}
                                            alt="Link preview"
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div className="p-3 bg-gray-100">
                                        <p className="text-xs text-gray-500 uppercase mb-1">
                                          {domain || 'ISLA.SO'}
                                        </p>
                                        {(tempInitialized ? tempTitle : title) && (
                                          <p className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
                                            {tempInitialized ? tempTitle : title}
                                          </p>
                                        )}
                                        {(tempInitialized ? tempDescription : description) && (
                                          <p className="text-xs text-gray-600 line-clamp-2">
                                            {tempInitialized ? tempDescription : description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-12 px-4 relative">
                                <FlickeringGrid
                                  className="z-0 absolute inset-0 size-full"
                                  squareSize={1.5}
                                  gridGap={2}
                                  color="#6b7280"
                                  maxOpacity={0.4}
                                  flickerChance={0.8}
                                />
                                <div className="relative z-10 flex flex-col items-center">
                                  <Image className="h-8 w-8 text-gray-400 mb-3" />
                                  <p className="text-xs text-gray-600 text-center">
                                    Enter a link to<br />generate a preview
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                    </>
                    )}
                  </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags for enabled features */}
            {(linkCloakingEnabled || searchEngineIndexingEnabled) && (
              <div className="px-8 py-2 flex items-center gap-2">
                {linkCloakingEnabled && (
                  <div className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-xs">
                    <X
                      className="h-3 w-3 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setLinkCloakingEnabled(false)}
                    />
                    <span className="text-gray-700">Link Cloaking</span>
                  </div>
                )}
                {searchEngineIndexingEnabled && (
                  <div className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-xs">
                    <X
                      className="h-3 w-3 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchEngineIndexingEnabled(false)}
                    />
                    <span className="text-gray-700">Search Engine Indexing</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer - more padding */}
            <div className="flex items-center justify-between px-8 py-4 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowUTMBuilder(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all">
                  <Milestone className="h-3.5 w-3.5 text-gray-600" />
                  UTM
                </button>
                <button
                  onClick={() => setShowTargeting(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
                >
                  <Target className="h-3.5 w-3.5 text-gray-600" />
                  Targeting
                </button>
                <button
                  onClick={() => setShowPassword(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
                >
                  <Lock className="h-3.5 w-3.5 text-gray-600" />
                  Password
                </button>
                <button
                  onClick={() => setShowExpiration(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
                >
                  <Clock className="h-3.5 w-3.5 text-gray-600" />
                  Expiration
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all">
                      <MoreHorizontal className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    <FeatureGate
                      featureKey="link_cloaking"
                      workspaceId={workspaceId}
                      fallback="custom"
                      customFallback={
                        <DropdownMenuItem
                          onClick={() => {
                            // Show upgrade prompt
                            window.location.href = '/billing/upgrade';
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm">Add Link Cloaking</span>
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            <Crown className="h-3 w-3" />
                            <span className="text-xs">PRO</span>
                          </div>
                        </DropdownMenuItem>
                      }
                    >
                      <DropdownMenuItem
                        onClick={() => setLinkCloakingEnabled(!linkCloakingEnabled)}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className={`h-4 w-4 ${linkCloakingEnabled ? 'text-blue-600' : ''}`} />
                          <span className="text-sm">{linkCloakingEnabled ? 'Remove' : 'Add'} Link Cloaking</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <Crown className="h-3 w-3" />
                          <span className="text-xs">PRO</span>
                        </div>
                      </DropdownMenuItem>
                    </FeatureGate>
                    <FeatureGate
                      featureKey="seo_indexing"
                      workspaceId={workspaceId}
                      fallback="custom"
                      customFallback={
                        <DropdownMenuItem
                          onClick={() => {
                            // Show upgrade prompt
                            window.location.href = '/billing/upgrade';
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileSearch className="h-4 w-4" />
                            <span className="text-sm whitespace-nowrap">Add Search Engine Indexing</span>
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            <Crown className="h-3 w-3" />
                            <span className="text-xs">PRO</span>
                          </div>
                        </DropdownMenuItem>
                      }
                    >
                      <DropdownMenuItem
                        onClick={() => setSearchEngineIndexingEnabled(!searchEngineIndexingEnabled)}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileSearch className={`h-4 w-4 ${searchEngineIndexingEnabled ? 'text-blue-600' : ''}`} />
                          <span className="text-sm whitespace-nowrap">{searchEngineIndexingEnabled ? 'Remove' : 'Add'} Search Engine Indexing</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <Crown className="h-3 w-3" />
                          <span className="text-xs">PRO</span>
                        </div>
                      </DropdownMenuItem>
                    </FeatureGate>
                    <DropdownMenuItem
                      onClick={() => setShowAdvancedSettings(true)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Advanced Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-3">
                {/* Remove the separate saved indicator since it's now in the Drafts button */}
                <Button
                  onClick={() => {
                    if (destinationUrl) {
                      // Ensure URL has protocol
                      const finalUrl = destinationUrl.trim().match(/^https?:\/\//i)
                        ? destinationUrl.trim()
                        : `https://${destinationUrl.trim()}`;

                      createLinkMutation.mutate({
                        workspaceId,
                        url: finalUrl,
                        slug: shortLink || undefined,
                        title: title || undefined,
                        description: description || undefined,
                        image: image || undefined,
                        folder_id: folderId || null,
                        tags: tags.length > 0 ? tags : undefined,
                        qrCodeSettings: {
                          backgroundColor: qrOptions.backgroundColor,
                          foregroundColor: qrOptions.foregroundColor,
                          logo: qrOptions.logo,
                        },
                        iosUrl: iosUrl || undefined,
                        androidUrl: androidUrl || undefined,
                        geoTargeting: geoTargeting && Object.keys(geoTargeting).length > 0 ? geoTargeting : undefined,
                        ...(linkPassword && { password: linkPassword }),
                        ...(expirationDate && { expiresAt: expirationDate }),
                        ...(expirationUrl && { expirationUrl: expirationUrl }),
                        ...(linkCloakingEnabled && { linkCloaking: true }),
                        ...(searchEngineIndexingEnabled === false && { seoIndexing: false }),
                        ...(externalId && { externalId: externalId }),
                        ...(tenantId && { tenantId: tenantId }),
                      });
                    }
                  }}
                  disabled={!destinationUrl || createLinkMutation.isLoading}
                  className="bg-black text-white hover:bg-gray-800 h-8 px-5 text-sm font-medium"
                >
                  {createLinkMutation.isLoading ? 'Creating...' : 'Create link'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Editor Modal */}
      <QRCodeEditor
        isOpen={showQREditor}
        onClose={() => setShowQREditor(false)}
        url={shortLink ? `https://${domain}/${shortLink}` : ''}
        onSave={(options) => setQrOptions(options)}
        currentOptions={qrOptions}
      />

      {/* Link Preview Editor Modal */}
      <LinkPreviewEditor
        isOpen={showLinkPreviewEditor}
        onClose={() => {
          setShowLinkPreviewEditor(false);
          // Don't reset temp values - keep them for preview
        }}
        onSave={(data) => {
          // Only save if feature is enabled (handled in LinkPreviewEditor)
          setTitle(data.title || '');
          setDescription(data.description || '');
          setImage(data.image || '');
          // Update temp values to match saved values
          setTempTitle(data.title || '');
          setTempDescription(data.description || '');
          setTempImage(data.image || '');
        }}
        onPreviewUpdate={(data) => {
          // Initialize temp values if not already done
          if (!tempInitialized) {
            setTempInitialized(true);
          }
          // Update temporary preview values without saving
          setTempTitle(data.title !== undefined ? data.title : '');
          setTempDescription(data.description !== undefined ? data.description : '');
          setTempImage(data.image !== undefined ? data.image : '');
        }}
        currentData={{
          title: tempInitialized ? tempTitle : title,
          description: tempInitialized ? tempDescription : description,
          image: tempInitialized ? tempImage : image
        }}
        workspaceId={workspaceId}
      />

      {/* UTM Builder Modal */}
      <UTMBuilderModal
        isOpen={showUTMBuilder}
        onClose={() => setShowUTMBuilder(false)}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        onSave={(utm) => {
          setUtmSource(utm.source);
          setUtmMedium(utm.medium);
          setUtmCampaign(utm.campaign);
          setUtmTerm(utm.term);
          setUtmContent(utm.content);
          // Note: We don't have a referral field in the current state
          // You may want to add it if needed
          setShowUTMBuilder(false);
        }}
        initialValues={{
          source: utmSource,
          medium: utmMedium,
          campaign: utmCampaign,
          term: utmTerm,
          content: utmContent,
        }}
        destinationUrl={destinationUrl}
      />

      {/* Targeting Modal */}
      <TargetingModal
        isOpen={showTargeting}
        onClose={() => setShowTargeting(false)}
        onSave={(targeting) => {
          setGeoTargeting(targeting.geoTargeting);
          setIosUrl(targeting.iosUrl);
          setAndroidUrl(targeting.androidUrl);
          setShowTargeting(false);
        }}
        initialValues={{
          geoTargeting,
          iosUrl,
          androidUrl,
        }}
        workspaceId={workspaceId}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPassword}
        onClose={() => setShowPassword(false)}
        onSave={(password) => {
          setLinkPassword(password);
          setShowPassword(false);
        }}
        initialPassword={linkPassword}
        workspaceId={workspaceId}
      />

      {/* Link Expiration Modal */}
      <LinkExpirationModal
        isOpen={showExpiration}
        onClose={() => setShowExpiration(false)}
        onSave={(date, url) => {
          setExpirationDate(date);
          setExpirationUrl(url);
          setShowExpiration(false);
        }}
        initialDate={expirationDate}
        initialUrl={expirationUrl}
        workspaceId={workspaceId}
      />

      {/* Advanced Settings Modal */}
      <AdvancedSettingsModal
        isOpen={showAdvancedSettings}
        onClose={() => setShowAdvancedSettings(false)}
        onSave={(extId, tId) => {
          setExternalId(extId);
          setTenantId(tId);
          setShowAdvancedSettings(false);
        }}
        initialExternalId={externalId}
        initialTenantId={tenantId}
      />
    </>
  );
}
