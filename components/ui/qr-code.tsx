'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Pencil, Download, Copy, HelpCircle, Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlickeringGrid } from '@/src/components/ui/shadcn-io/flickering-grid';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  className?: string;
  onEdit?: () => void;
  backgroundColor?: string;
  foregroundColor?: string;
  logo?: string;
}

// Simple QR Code component without containers for use in modals
interface QRCodeSimpleProps {
  url: string;
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  logo?: string;
}

function QRCodeSimple({
  url,
  size = 128,
  backgroundColor = '#FFFFFF',
  foregroundColor = '#000000',
  logo
}: QRCodeSimpleProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');

  useEffect(() => {
    if (!url) return;

    const generateQR = async () => {
      try {
        const dataURL = await QRCode.toDataURL(url, {
          width: size,
          margin: 0,
          color: {
            dark: foregroundColor,
            light: backgroundColor,
          },
          errorCorrectionLevel: 'H',
        });
        setQrCodeDataURL(dataURL);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [url, size, backgroundColor, foregroundColor]);

  if (!url || !qrCodeDataURL) {
    return <div className={`bg-gray-100 rounded animate-pulse`} style={{ width: size, height: size }} />;
  }

  return (
    <div className="relative">
      <img
        src={qrCodeDataURL}
        alt="QR Code"
        style={{ width: size, height: size }}
      />
      {logo && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 rounded-lg shadow-md"
          style={{ width: size * 0.25, height: size * 0.25 }}
        >
          <img src={logo} alt="Logo" className="w-full h-full object-contain" />
        </div>
      )}
    </div>
  );
}

export function QRCodeDisplay({
  url,
  size = 128,
  className,
  onEdit,
  backgroundColor = '#FFFFFF',
  foregroundColor = '#000000',
  logo
}: QRCodeDisplayProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');

  useEffect(() => {
    if (!url) return;

    const generateQR = async () => {
      try {
        const dataURL = await QRCode.toDataURL(url, {
          width: size,
          margin: 0,
          color: {
            dark: foregroundColor,
            light: backgroundColor,
          },
          errorCorrectionLevel: 'H', // High error correction for logo overlay
        });
        setQrCodeDataURL(dataURL);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [url, size, backgroundColor, foregroundColor]);

  if (!url) {
    return (
      <div className={cn("relative", className)}>
        <div className="rounded-lg px-2 py-3 bg-gray-50">
          <div className="rounded-md px-3 py-4 shadow-sm relative overflow-hidden bg-white">
            <FlickeringGrid
              className="z-0 absolute inset-0 size-full"
              squareSize={1.5}
              gridGap={2}
              color="#6b7280"
              maxOpacity={0.4}
              flickerChance={0.8}
            />
            <div className={`bg-gray-100 rounded flex items-center justify-center relative z-10`} style={{ width: size, height: size }}>
              <span className="text-xs text-gray-400">QR Code</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Outer container */}
      <div className="rounded-lg px-2 py-3 bg-gray-50">
        {/* Inner container with flickering grid behind QR code */}
        <div className="rounded-md px-3 py-4 shadow-sm relative overflow-hidden bg-white">
          <FlickeringGrid
            className="z-0 absolute inset-0 size-full"
            squareSize={1.5}
            gridGap={2}
            color="#6b7280"
            maxOpacity={0.4}
            flickerChance={0.8}
          />

          {/* Edit button as badge in top-right corner */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all"
              aria-label="Edit QR Code"
            >
              <Pencil className="h-3.5 w-3.5 text-gray-600" />
            </button>
          )}

          {qrCodeDataURL ? (
            <div className="relative z-10">
              <img
                src={qrCodeDataURL}
                alt="QR Code"
                className="block mx-auto"
                style={{ width: size, height: size }}
              />
              {logo && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 rounded-lg shadow-md"
                  style={{ width: size * 0.35, height: size * 0.35 }}
                >
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          ) : (
            <div className={`bg-gray-100 rounded animate-pulse mx-auto relative z-10`} style={{ width: size, height: size }} />
          )}
        </div>
      </div>
    </div>
  );
}

// QR Code Editor Modal Component
interface QRCodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onSave: (options: {
    backgroundColor: string;
    foregroundColor: string;
    logo?: string;
  }) => void;
  currentOptions?: {
    backgroundColor: string;
    foregroundColor: string;
    logo?: string;
  };
}

const presetColors = [
  '#000000', // Black (default with check)
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#FFC659', // Yellow
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
];

export function QRCodeEditor({
  isOpen,
  onClose,
  url,
  onSave,
  currentOptions = {
    backgroundColor: '#FFFFFF',
    foregroundColor: '#000000',
    logo: '/images/logos/isla-icon-black.svg',
  }
}: QRCodeEditorProps) {
  const [backgroundColor, setBackgroundColor] = useState(currentOptions.backgroundColor);
  const [foregroundColor, setForegroundColor] = useState(currentOptions.foregroundColor);
  const [logo, setLogo] = useState(currentOptions.logo || '/images/logos/isla-icon-black.svg');
  const [logoEnabled, setLogoEnabled] = useState(!!currentOptions.logo);
  const [copied, setCopied] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  // Close copy menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (copyMenuRef.current && !copyMenuRef.current.contains(event.target as Node)) {
        setShowCopyMenu(false);
      }
    };

    if (showCopyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCopyMenu]);

  const handleDownload = async () => {
    try {
      const dataURL = await QRCode.toDataURL(url, {
        width: 1024,
        margin: 0,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
        errorCorrectionLevel: 'H',
      });

      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = dataURL;
      link.click();
    } catch (err) {
      console.error('Error downloading QR code:', err);
    }
  };

  const handleCopyImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, url, {
        width: 256,
        margin: 0,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setShowCopyMenu(false);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (err) {
      console.error('Error copying QR code:', err);
    }
  };

  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowCopyMenu(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying URL:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">QR Code</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-200">
              <Crown className="h-3 w-3" />
              PRO
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* QR Code Preview Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                QR Code Preview
                <InfoTooltip
                  align="center"
                  content={
                    <div className="text-center">
                      Customize your QR code to fit your brand.{" "}
                      <a
                        href="https://isla.so/help/article/custom-qr-codes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium text-gray-900 hover:text-gray-700"
                      >
                        Learn more.
                      </a>
                    </div>
                  }
                />
              </label>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    onClick={handleDownload}
                    className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Download QR Code"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-gray-200 whitespace-nowrap">
                      <span className="text-sm text-gray-700">Download QR code</span>
                    </div>
                  </div>
                </div>
                <div className="relative" ref={copyMenuRef}>
                  <button
                    onClick={() => setShowCopyMenu(!showCopyMenu)}
                    className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Copy QR Code"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  {/* Copy menu dropdown */}
                  {showCopyMenu && !copied && (
                    <div className="absolute top-full right-0 mt-2 z-20">
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
                        <button
                          onClick={handleCopyImage}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                        >
                          <Copy className="h-3.5 w-3.5 text-gray-500" />
                          <span>Copy image</span>
                        </button>
                        <button
                          onClick={handleCopyURL}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                        >
                          <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span>Copy URL</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="rounded-lg px-2 py-3 bg-gray-50">
              <div className="rounded-md px-8 py-8 shadow-sm relative overflow-hidden bg-white">
                <FlickeringGrid
                  className="z-0 absolute inset-0 size-full"
                  squareSize={1.5}
                  gridGap={2}
                  color="#6b7280"
                  maxOpacity={0.4}
                  flickerChance={0.8}
                />
                <div className="relative z-10 flex justify-center">
                  <QRCodeSimple
                    url={url}
                    size={200}
                    backgroundColor={backgroundColor}
                    foregroundColor={foregroundColor}
                    logo={logoEnabled ? logo : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo Toggle */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                Logo
                <InfoTooltip content="Add your brand logo to the center of the QR code" />
              </label>
              <button
                type="button"
                onClick={() => setLogoEnabled(!logoEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  logoEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow transition-transform ${
                  logoEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}>
                  {logoEnabled && <Crown className="h-2.5 w-2.5 text-gray-600" />}
                </span>
              </button>
            </div>
          </div>

          {/* QR Code Color */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-3">
              QR Code Color
            </label>
            <div className="flex items-center gap-3">
              {/* Color input with hex value */}
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
                <div
                  className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: foregroundColor }}
                />
                <input
                  type="text"
                  value={foregroundColor.toUpperCase()}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="w-20 text-sm font-mono outline-none"
                />
              </div>

              {/* Preset colors */}
              <div className="flex items-center gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForegroundColor(color)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      foregroundColor.toLowerCase() === color.toLowerCase()
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {foregroundColor.toLowerCase() === color.toLowerCase() && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave({ backgroundColor, foregroundColor, logo: logoEnabled ? logo : undefined });
                onClose();
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}