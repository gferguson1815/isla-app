"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { HelpWidget } from "@/components/help/HelpWidget";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { generateSlugFromName, validateWorkspaceSlug } from "@/lib/utils/slug";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];

export default function WorkspaceCreationPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [isManualSlugEdit, setIsManualSlugEdit] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    slug?: string;
    logo?: string;
    general?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout>();
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const createWorkspaceMutation = trpc.workspace.create.useMutation({
    onSuccess: (workspace) => {
      router.push(`/onboarding/domain?workspace=${workspace.slug}`);
    },
    onError: (error) => {
      setIsCreating(false);
      setErrors({ general: error.message || "Failed to create workspace" });
    },
  });

  const { refetch: checkSlugAvailability } = trpc.workspace.checkSlug.useQuery(
    { slug: workspaceSlug },
    {
      enabled: false,
      retry: false,
    }
  );

  useEffect(() => {
    if (!isManualSlugEdit && workspaceName) {
      const generatedSlug = generateSlugFromName(workspaceName);
      setWorkspaceSlug(generatedSlug);
    }
  }, [workspaceName, isManualSlugEdit]);

  useEffect(() => {
    if (!workspaceSlug) {
      setSlugAvailable(null);
      return;
    }

    const validation = validateWorkspaceSlug(workspaceSlug);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, slug: validation.error }));
      setSlugAvailable(false);
      return;
    } else {
      setErrors(prev => ({ ...prev, slug: undefined }));
    }

    if (slugCheckTimeoutRef.current) {
      clearTimeout(slugCheckTimeoutRef.current);
    }

    setIsCheckingSlug(true);
    slugCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await checkSlugAvailability();
        setSlugAvailable(result.data?.available ?? null);
        if (!result.data?.available) {
          setErrors(prev => ({ ...prev, slug: "This slug is already taken" }));
        }
      } catch (error) {
        console.error("Slug check failed:", error);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => {
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
      }
    };
  }, [workspaceSlug, checkSlugAvailability]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors(prev => ({ ...prev, logo: undefined }));

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: "Please upload a PNG, JPG, SVG, or WebP image" }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, logo: "File size must be less than 5MB" }));
      return;
    }

    setLogoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const uploadLogoToSupabase = async (workspaceId: string): Promise<string | null> => {
    if (!logoFile) return null;

    const supabase = createClient();
    const fileExtension = logoFile.name.split(".").pop();
    const fileName = `${workspaceId}/logo.${fileExtension}`;

    const { error } = await supabase.storage
      .from("workspace-logos")
      .upload(fileName, logoFile, {
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      console.error("Logo upload error:", error);
      throw new Error("Failed to upload logo");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("workspace-logos")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!workspaceName || workspaceName.trim().length === 0) {
      newErrors.name = "Workspace name is required";
    } else if (workspaceName.length > 50) {
      newErrors.name = "Workspace name must be 50 characters or less";
    }

    const slugValidation = validateWorkspaceSlug(workspaceSlug);
    if (!slugValidation.valid) {
      newErrors.slug = slugValidation.error;
    } else if (slugAvailable === false) {
      newErrors.slug = "This slug is already taken";
    }

    if (!logoFile) {
      newErrors.logo = "Logo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateWorkspace = async () => {
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField === "name") {
        document.getElementById("workspace-name")?.focus();
      } else if (firstErrorField === "slug") {
        document.getElementById("workspace-slug")?.focus();
      }
      return;
    }

    setIsCreating(true);
    setErrors({});

    try {
      const tempWorkspaceId = crypto.randomUUID();
      const logoUrl = await uploadLogoToSupabase(tempWorkspaceId);

      await createWorkspaceMutation.mutateAsync({
        name: workspaceName.trim(),
        slug: workspaceSlug,
        logoUrl: logoUrl || undefined,
      });
    } catch (error) {
      console.error("Workspace creation error:", error);
      setIsCreating(false);
      setErrors({ general: "Failed to create workspace. Please try again." });
    }
  };

  const isFormValid =
    workspaceName.trim().length > 0 &&
    workspaceSlug.length >= 3 &&
    slugAvailable === true &&
    logoFile !== null &&
    !Object.keys(errors).some(key => errors[key as keyof typeof errors]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-zinc-900 relative">
        {/* Aurora gradient effect - visible arc at top */}
        <div className="absolute inset-x-0 top-0 h-[30vh] overflow-hidden pointer-events-none">
          {/* Main centered gradient */}
          <div
            className="absolute -top-[15vh] left-1/2 -translate-x-1/2"
            style={{
              width: '120vw',
              height: '50vh',
              background: `
                radial-gradient(
                  ellipse 100% 100% at 50% 0%,
                  rgba(147, 51, 234, 0.25) 0%,
                  rgba(79, 70, 229, 0.2) 20%,
                  rgba(237, 100, 166, 0.15) 40%,
                  transparent 65%
                )
              `,
            }}
          />

          {/* Side color accents */}
          <div
            className="absolute -top-[10vh] left-[15vw]"
            style={{
              width: '35vw',
              height: '35vh',
              background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 45%)',
            }}
          />

          <div
            className="absolute -top-[10vh] right-[15vw]"
            style={{
              width: '35vw',
              height: '35vh',
              background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 45%)',
            }}
          />

          {/* Soft fade to white at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        {/* Logo positioned at top */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
          <h1 className="logo-text-header text-5xl text-black dark:text-white">
            isla
          </h1>
        </div>

        {/* Form centered in viewport */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center justify-center min-h-screen px-4"
        >
          <div className="w-full max-w-[28rem]">
            <div className="bg-white rounded-xl p-8">
              <div className="mb-8 text-center">
                <h2 className="text-[1.75rem] leading-tight font-medium text-gray-900 mb-2.5">
                  Create your workspace
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Set up a shared space to manage <br />
                  your links with your team.{" "}
                  <a href="/help/workspace" className="text-gray-900 underline underline-offset-2 hover:text-gray-700 transition-colors">
                    Learn more.
                  </a>
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="workspace-name" className="text-sm font-medium text-gray-900 mb-2 block">
                    Workspace name
                  </Label>
                  <input
                    id="workspace-name"
                    type="text"
                    placeholder="Acme, Inc."
                    value={workspaceName}
                    onChange={(e) => {
                      setWorkspaceName(e.target.value);
                      setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    maxLength={50}
                    autoComplete="off"
                    className={cn(
                      "w-full h-12 px-3 text-base bg-white border border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors",
                      errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workspace-slug" className="text-sm font-medium text-gray-900 mb-2 block">
                    Workspace slug
                  </Label>
                  <div className="flex items-center h-12 bg-white border border-gray-200 rounded-lg focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 overflow-hidden transition-colors">
                    <span className="px-3 text-gray-500 bg-gray-50 border-r border-gray-200 h-full flex items-center text-sm">
                      app.isla.so/
                    </span>
                    <div className="relative flex-1">
                      <input
                        id="workspace-slug"
                        type="text"
                        value={workspaceSlug}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setWorkspaceSlug(value);
                          setIsManualSlugEdit(true);
                          setErrors(prev => ({ ...prev, slug: undefined }));
                        }}
                        maxLength={30}
                        autoComplete="off"
                        className={cn(
                          "w-full h-full px-3 text-base bg-transparent border-0 focus:ring-0 focus:outline-none",
                          errors.slug && "text-red-600"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingSlug && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!isCheckingSlug && slugAvailable === true && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        {!isCheckingSlug && slugAvailable === false && (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    You can change this later in your workspace settings.
                  </p>
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workspace-logo" className="text-sm font-medium text-gray-900 mb-2 block">
                    Workspace logo
                  </Label>
                  <input
                    ref={fileInputRef}
                    id="workspace-logo"
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "w-16 h-16 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center transition-all hover:border-gray-400 overflow-hidden",
                          logoPreview && "border-0 p-0",
                          errors.logo && "border-red-500"
                        )}
                      >
                        {logoPreview ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <Upload className="h-6 w-6 text-gray-600" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1">
                      {logoPreview ? (
                        <>
                          <p className="text-sm text-gray-900 font-medium">
                            {logoFile?.name || "Logo uploaded"}
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-gray-600 hover:text-gray-900 mt-0.5"
                          >
                            Click to change image
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-gray-900 font-medium hover:text-gray-700"
                          >
                            Upload image
                          </button>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Recommended size: 160x160px
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.logo && (
                    <p className="mt-2 text-sm text-red-600">{errors.logo}</p>
                  )}
                </div>

                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                )}

                <Button
                  onClick={handleCreateWorkspace}
                  disabled={!isFormValid || isCreating}
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating workspace...
                    </>
                  ) : (
                    "Create workspace"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {user && (
          <div className="fixed bottom-6 left-6 z-50">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You&apos;re signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user.email}</span>
              </p>
              <button
                onClick={() => signOut()}
                className="inline-block px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
              >
                Sign in as a different user
              </button>
            </div>
          </div>
        )}

        <HelpWidget />
      </div>
    </ErrorBoundary>
  );
}