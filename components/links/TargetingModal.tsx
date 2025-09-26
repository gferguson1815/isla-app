'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Smartphone, Crown, Plus, ChevronDown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

// Country list with codes - United States first, then alphabetical
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AX', name: 'Åland Islands', flag: '🇦🇽' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AS', name: 'American Samoa', flag: '🇦🇸' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮' },
  { code: 'AQ', name: 'Antarctica', flag: '🇦🇶' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BM', name: 'Bermuda', flag: '🇧🇲' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BV', name: 'Bouvet Island', flag: '🇧🇻' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IO', name: 'British Indian Ocean Territory', flag: '🇮🇴' },
  { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
  { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CX', name: 'Christmas Island', flag: '🇨🇽' },
  { code: 'CC', name: 'Cocos (Keeling) Islands', flag: '🇨🇨' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩' },
  { code: 'CK', name: 'Cook Islands', flag: '🇨🇰' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CW', name: 'Curaçao', flag: '🇨🇼' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FK', name: 'Falkland Islands', flag: '🇫🇰' },
  { code: 'FO', name: 'Faroe Islands', flag: '🇫🇴' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GF', name: 'French Guiana', flag: '🇬🇫' },
  { code: 'PF', name: 'French Polynesia', flag: '🇵🇫' },
  { code: 'TF', name: 'French Southern Territories', flag: '🇹🇫' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GI', name: 'Gibraltar', flag: '🇬🇮' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GL', name: 'Greenland', flag: '🇬🇱' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GG', name: 'Guernsey', flag: '🇬🇬' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HM', name: 'Heard Island and McDonald Islands', flag: '🇭🇲' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IM', name: 'Isle of Man', flag: '🇮🇲' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JE', name: 'Jersey', flag: '🇯🇪' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MS', name: 'Montserrat', flag: '🇲🇸' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'UM', name: 'United States Minor Outlying Islands', flag: '🇺🇲' },
  { code: 'VI', name: 'United States Virgin Islands', flag: '🇻🇮' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'WF', name: 'Wallis and Futuna', flag: '🇼🇫' },
  { code: 'EH', name: 'Western Sahara', flag: '🇪🇭' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
];

interface TargetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (targeting: {
    geoTargeting: { locations: Array<{ code: string; name: string; flag: string; url: string }> };
    iosUrl: string;
    androidUrl: string;
  }) => void;
  initialValues?: {
    geoTargeting?: { locations: Array<{ code: string; name: string; flag: string; url?: string }> };
    iosUrl?: string;
    androidUrl?: string;
  };
  workspaceId: string;
}

// Simple tooltip component
function ProTooltip({
  children,
  content
}: {
  children: React.ReactNode;
  content: { text: string; link: string; linkText: string }
}) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 10, // Position above with some offset
        left: rect.left + rect.width / 2
      });
      setShow(true);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
        className="inline-block"
      >
        {children}
      </div>
      {show && (
        <div
          className="fixed z-[100] transform -translate-x-1/2 -translate-y-full"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: '320px'
          }}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-700 text-center">
            <p>{content.text}</p>
            <a
              href={content.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 underline hover:text-gray-700 mt-1 inline-block"
            >
              {content.linkText}
            </a>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function TargetingModal({
  isOpen,
  onClose,
  onSave,
  initialValues = {},
  workspaceId,
}: TargetingModalProps) {
  const [geoLocations, setGeoLocations] = useState<Array<{ code: string; name: string; flag: string; url: string }>>(
    initialValues.geoTargeting?.locations || []
  );
  const [iosUrl, setIosUrl] = useState(initialValues.iosUrl || '');
  const [androidUrl, setAndroidUrl] = useState(initialValues.androidUrl || '');
  const [showGeoUpgrade, setShowGeoUpgrade] = useState(false);
  const [showIosUpgrade, setShowIosUpgrade] = useState(false);
  const [showAndroidUpgrade, setShowAndroidUpgrade] = useState(false);
  const geoUpgradeRef = useRef<HTMLDivElement>(null);
  const iosUpgradeRef = useRef<HTMLDivElement>(null);
  const androidUpgradeRef = useRef<HTMLDivElement>(null);
  const ignoreNextClick = useRef(false);
  const prevIsOpen = useRef(false);
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params?.workspace as string || workspaceId;

  // Check feature gates
  const { checkFeature } = useFeatureGate(workspaceId);
  const geoTargetingFeature = checkFeature('geo_targeting');
  const deviceTargetingFeature = checkFeature('device_targeting');

  // Reset values only when modal opens (not on every render)
  useEffect(() => {
    // Only reset when modal transitions from closed to open
    if (isOpen && !prevIsOpen.current) {
      setGeoLocations(initialValues.geoTargeting?.locations?.map(loc => ({ ...loc, url: loc.url || '' })) || []);
      setIosUrl(initialValues.iosUrl || '');
      setAndroidUrl(initialValues.androidUrl || '');
      setShowGeoUpgrade(false);
      setShowIosUpgrade(false);
      setShowAndroidUpgrade(false);
    }
    prevIsOpen.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen to prevent unwanted re-runs

  // Close dropdowns when clicking outside - TEMPORARILY DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     // Skip if we should ignore this click
  //     if (ignoreNextClick.current) {
  //       ignoreNextClick.current = false;
  //       return;
  //     }

  //     const target = event.target as Node;

  //     // Handle location picker
  //     if (showLocationPicker && dropdownRef.current && !dropdownRef.current.contains(target)) {
  //       setShowLocationPicker(false);
  //       setLocationSearch('');
  //     }

  //     // Handle geo upgrade
  //     if (showGeoUpgrade && geoUpgradeRef.current && !geoUpgradeRef.current.contains(target)) {
  //       setShowGeoUpgrade(false);
  //     }

  //     // Handle iOS upgrade
  //     if (showIosUpgrade && iosUpgradeRef.current && !iosUpgradeRef.current.contains(target)) {
  //       setShowIosUpgrade(false);
  //     }

  //     // Handle Android upgrade
  //     if (showAndroidUpgrade && androidUpgradeRef.current && !androidUpgradeRef.current.contains(target)) {
  //       setShowAndroidUpgrade(false);
  //     }
  //   };

  //   // Always add the listener when modal is open
  //   if (isOpen) {
  //     document.addEventListener('click', handleClickOutside);
  //     return () => {
  //       document.removeEventListener('click', handleClickOutside);
  //     };
  //   }
  // }, [isOpen, showLocationPicker, showGeoUpgrade, showIosUpgrade, showAndroidUpgrade]);

  const handleAddLocation = (country: { code: string; name: string; flag: string }) => {
    setGeoLocations([...geoLocations, { ...country, url: '' }]);
    setShowLocationPicker(false);
    setLocationSearch('');
  };

  const handleRemoveLocation = (countryCode: string) => {
    setGeoLocations(geoLocations.filter(loc => loc.code !== countryCode));
  };

  const handleLocationUrlChange = (countryCode: string, url: string) => {
    setGeoLocations(geoLocations.map(loc =>
      loc.code === countryCode ? { ...loc, url } : loc
    ));
  };

  const handleSave = () => {
    onSave({
      geoTargeting: { locations: geoLocations },
      iosUrl,
      androidUrl,
    });
    onClose();
  };

  // Check if any targeting is configured (geo locations must have URLs)
  const hasValidGeoTargeting = geoLocations.length > 0 && geoLocations.every(loc => loc.url.trim() !== '');
  const hasTargeting = hasValidGeoTargeting || iosUrl.trim() !== '' || androidUrl.trim() !== '';

  const handleCancel = () => {
    // Reset to initial values
    setGeoLocations(initialValues.geoTargeting?.locations?.map(loc => ({ ...loc, url: loc.url || '' })) || []);
    setIosUrl(initialValues.iosUrl || '');
    setAndroidUrl(initialValues.androidUrl || '');
    setShowGeoUpgrade(false);
    setShowIosUpgrade(false);
    setShowAndroidUpgrade(false);
    onClose();
  };

  const handleAddLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Set flag to ignore the next document click
    ignoreNextClick.current = true;

    if (!geoTargetingFeature.enabled) {
      setShowGeoUpgrade(true);
    } else {
      // Add a default location (United States) with empty URL
      const defaultCountry = COUNTRIES[0]; // United States is first
      if (!geoLocations.some(loc => loc.code === defaultCountry.code)) {
        setGeoLocations([...geoLocations, { ...defaultCountry, url: '' }]);
      } else {
        // Find first country not already selected
        const availableCountry = COUNTRIES.find(c => !geoLocations.some(loc => loc.code === c.code));
        if (availableCountry) {
          setGeoLocations([...geoLocations, { ...availableCountry, url: '' }]);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
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
            Targeting
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              G
            </span>
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
        <div className="p-6 space-y-6">
          {/* Geo Targeting */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-sm font-medium text-gray-900">
                Geo Targeting
              </Label>
              <ProTooltip
                content={{
                  text: 'Redirect your users to different links based on their location.',
                  link: 'https://isla.so/help/article/geo-targeting',
                  linkText: 'Learn more about geo targeting.'
                }}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded cursor-help focus:outline-none"
                >
                  <Crown className="h-3 w-3" />
                  PRO
                </button>
              </ProTooltip>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              {/* Selected countries */}
              {geoLocations.map((location, index) => (
                <div key={location.code} className="flex items-center gap-2">
                  {/* Country dropdown */}
                  <div className="relative w-44">
                    <select
                      value={location.code}
                      onChange={(e) => {
                        const newCountry = COUNTRIES.find(c => c.code === e.target.value);
                        if (newCountry) {
                          const newLocations = [...geoLocations];
                          newLocations[index] = { ...newCountry, url: location.url };
                          setGeoLocations(newLocations);
                        }
                      }}
                      className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                    >
                      {COUNTRIES.filter(c =>
                        !geoLocations.some(loc => loc.code === c.code) || c.code === location.code
                      ).map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* URL input */}
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={location.url}
                    onChange={(e) => handleLocationUrlChange(location.code, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />

                  {/* Delete button */}
                  <button
                    onClick={() => handleRemoveLocation(location.code)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}

              {/* Add location button */}
              <div className="relative" ref={geoUpgradeRef}>
                <button
                  onClick={handleAddLocationClick}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-center font-medium"
                >
                  Add location
                </button>

                {/* Geo Targeting Upgrade Dropdown */}
                {showGeoUpgrade && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm text-gray-600 text-center mb-4">
                      You can only use Geo Targeting on a Pro plan and above. Upgrade to Pro to continue.
                    </p>
                    <Button
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                      onClick={() => router.push(`/${workspaceSlug}/settings/billing?upgrade=true&reason=geo_targeting`)}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* iOS Targeting */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-sm font-medium text-gray-900">
                iOS Targeting
              </Label>
              <ProTooltip
                content={{
                  text: 'Redirect your iOS users to a different link.',
                  link: 'https://isla.so/help/article/device-targeting',
                  linkText: 'Learn more about device targeting.'
                }}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded cursor-help focus:outline-none"
                >
                  <Crown className="h-3 w-3" />
                  PRO
                </button>
              </ProTooltip>
            </div>
            <div className="relative" ref={iosUpgradeRef}>
              <input
                type="url"
                placeholder="https://apps.apple.com/app/1611158928"
                value={iosUrl}
                onChange={(e) => setIosUrl(e.target.value)}
                onFocus={() => {
                  if (!deviceTargetingFeature.enabled) {
                    setShowIosUpgrade(true);
                  }
                }}
                className="w-full px-3 py-2 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />

              {/* iOS Targeting Upgrade Dropdown */}
              {showIosUpgrade && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                  <p className="text-sm text-gray-600 text-center mb-4">
                    You can only use iOS Targeting on a Pro plan and above. Upgrade to Pro to continue.
                  </p>
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={() => router.push(`/${workspaceSlug}/settings/billing?upgrade=true&reason=device_targeting`)}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Android Targeting */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-sm font-medium text-gray-900">
                Android Targeting
              </Label>
              <ProTooltip
                content={{
                  text: 'Redirect your Android users to a different link.',
                  link: 'https://isla.so/help/article/device-targeting',
                  linkText: 'Learn more about device targeting.'
                }}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded cursor-help focus:outline-none"
                >
                  <Crown className="h-3 w-3" />
                  PRO
                </button>
              </ProTooltip>
            </div>
            <div className="relative" ref={androidUpgradeRef}>
              <input
                type="url"
                placeholder="https://play.google.com/store/apps/details?id=com.disney.disneyplus"
                value={androidUrl}
                onChange={(e) => setAndroidUrl(e.target.value)}
                onFocus={() => {
                  if (!deviceTargetingFeature.enabled) {
                    setShowAndroidUpgrade(true);
                  }
                }}
                className="w-full px-3 py-2 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />

              {/* Android Targeting Upgrade Dropdown */}
              {showAndroidUpgrade && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                  <p className="text-sm text-gray-600 text-center mb-4">
                    You can only use Android Targeting on a Pro plan and above. Upgrade to Pro to continue.
                  </p>
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={() => router.push(`/${workspaceSlug}/settings/billing?upgrade=true&reason=device_targeting`)}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasTargeting}
            className="h-9 px-4 bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add targeting
          </Button>
        </div>
      </div>
    </div>
  );
}