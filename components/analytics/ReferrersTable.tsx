'use client';

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ExternalLink, Search, Globe, Share2, TrendingUp, Link } from 'lucide-react';

interface ReferrerData {
  referrer: string;
  referrerType: 'search' | 'social' | 'direct' | 'external' | null;
  count: number;
  percentage: number;
}

interface ReferrersTableProps {
  data: ReferrerData[];
}

const getReferrerTypeIcon = (type: ReferrerData['referrerType']) => {
  switch (type) {
    case 'search':
      return <Search className="h-3 w-3" />;
    case 'social':
      return <Share2 className="h-3 w-3" />;
    case 'direct':
      return <TrendingUp className="h-3 w-3" />;
    case 'external':
      return <Link className="h-3 w-3" />;
    default:
      return <Globe className="h-3 w-3" />;
  }
};

const getReferrerTypeBadgeVariant = (type: ReferrerData['referrerType']) => {
  switch (type) {
    case 'search':
      return 'default';
    case 'social':
      return 'secondary';
    case 'direct':
      return 'outline';
    case 'external':
      return 'default';
    default:
      return 'outline';
  }
};

export const ReferrersTable = memo(function ReferrersTable({ data }: ReferrersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedType, setSelectedType] = useState<ReferrerData['referrerType'] | 'all'>('all');

  const filteredData = data.filter(item => {
    const matchesSearch = item.referrer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.referrerType === selectedType;
    return matchesSearch && matchesType;
  });

  const displayData = showAll ? filteredData : filteredData.slice(0, 10);

  const typeStats = data.reduce((acc, item) => {
    const type = item.referrerType || 'unknown';
    acc[type] = (acc[type] || 0) + item.count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search referrers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
          >
            All
          </Button>
          {(['search', 'social', 'direct', 'external'] as const).map(type => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {getReferrerTypeIcon(type)}
              <span className="ml-1 capitalize">{type}</span>
              <span className="ml-1 text-xs">({typeStats[type] || 0})</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Referrers List */}
      <div className="space-y-2">
        {displayData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No referrer data available
          </p>
        ) : (
          displayData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground w-8">
                  #{index + 1}
                </div>
                <Badge variant={getReferrerTypeBadgeVariant(item.referrerType)}>
                  {getReferrerTypeIcon(item.referrerType)}
                  <span className="ml-1 capitalize">{item.referrerType || 'unknown'}</span>
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.referrer === 'direct' ? 'Direct Traffic' : item.referrer}
                  </p>
                </div>
                {item.referrer !== 'direct' && (
                  <a
                    href={item.referrer.startsWith('http') ? item.referrer : `https://${item.referrer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{item.count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">clicks</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.percentage.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">of total</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {filteredData.length > 10 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-1"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All ({filteredData.length - 10} more) <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});