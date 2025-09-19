"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Link2, Shuffle, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { generateRandomSlug } from "@/lib/utils/slug";
import { appConfig } from "@/lib/config/app";
import { trpc } from "@/lib/trpc/client";
import { useWorkspace } from "@/contexts/workspace-context";

const quickCreateSchema = z.object({
  url: z
    .string()
    .url("Please enter a valid URL")
    .refine((url) => {
      try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "URL must start with http:// or https://"),
  slug: z
    .string()
    .min(
      appConfig.links.customSlugMinLength,
      `Slug must be at least ${appConfig.links.customSlugMinLength} characters`
    )
    .max(
      appConfig.links.customSlugMaxLength,
      `Slug must be at most ${appConfig.links.customSlugMaxLength} characters`
    )
    .regex(/^[a-zA-Z0-9-]+$/, "Slug can only contain letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
});

type QuickCreateFormData = z.infer<typeof quickCreateSchema>;

export function QuickCreateDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspace();
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickCreateFormData>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: {
      url: "",
      slug: "",
      title: "",
    },
  });

  const watchedSlug = watch("slug");

  const createLinkMutation = trpc.link.create.useMutation({
    onSuccess: (data) => {
      const shortUrl = `${appConfig.shortDomain}/${data.slug}`;
      setGeneratedLink(shortUrl);
      toast.success("Link created successfully!");
      utils.link.list.invalidate();
    },
    onError: (error) => {
      if (error.message.includes("Slug already exists")) {
        toast.error("This slug is already taken. Please try another one.");
      } else {
        toast.error(error.message || "Failed to create link");
      }
    },
  });

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 100);
    };
    window.addEventListener("openQuickCreate", handleOpen);
    return () => window.removeEventListener("openQuickCreate", handleOpen);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (!isTyping && e.key === "c") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => {
          urlInputRef.current?.focus();
        }, 100);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handlePaste = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && /^https?:\/\//i.test(text)) {
          setValue("url", text);
        }
      } catch {
        console.error("Failed to read clipboard");
      }
    };

    if (open && !watch("url")) {
      handlePaste();
    }
  }, [open, setValue, watch]);

  const generateSlug = () => {
    const slug = generateRandomSlug();
    setValue("slug", slug);
  };

  const onSubmit = async (data: QuickCreateFormData) => {
    if (!currentWorkspace) {
      toast.error("Please select a workspace");
      return;
    }

    const finalSlug = data.slug || generateRandomSlug();

    await createLinkMutation.mutateAsync({
      workspaceId: currentWorkspace.id,
      url: data.url,
      slug: finalSlug,
      title: data.title,
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    setGeneratedLink("");
    setCopied(false);
  };

  const handleCreateAnother = () => {
    reset();
    setGeneratedLink("");
    setCopied(false);
    setTimeout(() => {
      urlInputRef.current?.focus();
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Create Link</DialogTitle>
          <DialogDescription>Paste a URL and optionally customize the short link</DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Destination URL *</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("url")}
                    ref={urlInputRef}
                    type="url"
                    placeholder="https://example.com/long-url"
                    className="pl-10"
                    autoComplete="off"
                  />
                </div>
                {errors.url && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{errors.url.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Custom Slug (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    {...register("slug")}
                    placeholder="my-custom-link"
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateSlug}
                    title="Generate random slug"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                {watchedSlug && (
                  <p className="text-xs text-muted-foreground">
                    Your link will be: {appConfig.shortDomain}/{watchedSlug}
                  </p>
                )}
                {errors.slug && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{errors.slug.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  {...register("title")}
                  placeholder="Link title for easy identification"
                  autoComplete="off"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || createLinkMutation.isPending}>
                {isSubmitting || createLinkMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-8 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <Label>Your short link:</Label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCreateAnother}>
                Create Another
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
