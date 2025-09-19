'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Smartphone, Tablet, Globe, Clock, Filter, Search, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: string;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  browserVersion?: string | null;
  os: string;
  osVersion?: string | null;
  referrer?: string | null;
  referrerType?: 'search' | 'social' | 'direct' | 'external' | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

interface ClickTimelineProps {
  events: ClickEvent[];
  linkId: string;
}

const getDeviceIcon = (device: ClickEvent['device']) => {
  switch (device) {
    case 'desktop':
      return <Monitor className="h-4 w-4" />;
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
  }
};

const getReferrerTypeBadge = (type: ClickEvent['referrerType']) => {
  const variants = {
    search: 'default',
    social: 'secondary',
    direct: 'outline',
    external: 'default'
  } as const;

  return (
    <Badge variant={(variants[type as keyof typeof variants] || 'outline') as any}>
      {type || 'unknown'}
    </Badge>
  );
};

const ClickEventRow = memo(function ClickEventRow({
  event,
  style
}: {
  event: ClickEvent;
  style: React.CSSProperties;
}) {
  return (
    <div style={style} className="border-b border-border hover:bg-accent/50 transition-colors">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(parseISO(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
              </span>
              <div className="flex items-center gap-1">
                {getDeviceIcon(event.device)}
                <span className="text-xs text-muted-foreground">{event.device}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">
                  {event.city && event.region
                    ? `${event.city}, ${event.region}, ${event.country}`
                    : event.country || 'Unknown location'}
                </span>
              </div>

              <Badge variant="outline" className="text-xs">
                {event.browser} {event.browserVersion || ''}
              </Badge>

              <Badge variant="outline" className="text-xs">
                {event.os} {event.osVersion || ''}
              </Badge>

              {event.referrerType && getReferrerTypeBadge(event.referrerType)}
            </div>

            {event.referrer && event.referrer !== 'direct' && (
              <div className="text-xs text-muted-foreground">
                From: {event.referrer}
              </div>
            )}

            {(event.utmSource || event.utmMedium || event.utmCampaign) && (
              <div className="flex gap-2 flex-wrap">
                {event.utmSource && (
                  <Badge variant="outline" className="text-xs">
                    utm_source: {event.utmSource}
                  </Badge>
                )}
                {event.utmMedium && (
                  <Badge variant="outline" className="text-xs">
                    utm_medium: {event.utmMedium}
                  </Badge>
                )}
                {event.utmCampaign && (
                  <Badge variant="outline" className="text-xs">
                    utm_campaign: {event.utmCampaign}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const ClickTimeline = memo(function ClickTimeline({
  events: initialEvents,
  linkId
}: ClickTimelineProps) {
  const [events, setEvents] = useState<ClickEvent[]>(initialEvents);
  const [filteredEvents, setFilteredEvents] = useState<ClickEvent[]>(initialEvents);
  const [deviceFilter, setDeviceFilter] = useState<'all' | ClickEvent['device']>('all');
  const [browserFilter, setBrowserFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`click-events-${linkId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'click_events',
          filter: `link_id=eq.${linkId}`
        },
        (payload) => {
          const newEvent = payload.new as ClickEvent;
          setEvents(prev => [newEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [linkId, supabase]);

  useEffect(() => {
    let filtered = events;

    if (deviceFilter !== 'all') {
      filtered = filtered.filter(e => e.device === deviceFilter);
    }

    if (browserFilter !== 'all') {
      filtered = filtered.filter(e => e.browser === browserFilter);
    }

    if (countryFilter !== 'all') {
      filtered = filtered.filter(e => e.country === countryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.referrer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, deviceFilter, browserFilter, countryFilter, searchTerm]);

  const uniqueBrowsers = Array.from(new Set(events.map(e => e.browser)));
  const uniqueCountries = Array.from(new Set(events.map(e => e.country).filter(Boolean)));

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <ClickEventRow event={filteredEvents[index]} style={style} />
    ),
    [filteredEvents]
  );

  return (
    <div className="space-y-4">
      {/* Real-time Status */}
      <div className="flex items-center gap-2 text-sm">
        <Activity className="h-4 w-4 text-green-500 animate-pulse" />
        <span className="text-muted-foreground">Real-time updates active</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={deviceFilter} onValueChange={(value) => setDeviceFilter(value as any)}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
          </SelectContent>
        </Select>

        <Select value={browserFilter} onValueChange={setBrowserFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Browser" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Browsers</SelectItem>
            {uniqueBrowsers.map(browser => (
              <SelectItem key={browser} value={browser}>
                {browser}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map(country => (
              <SelectItem key={country} value={country!}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      <div className="border border-border rounded-lg">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No click events match your filters</p>
          </div>
        ) : (
          <List
            height={400}
            itemCount={filteredEvents.length}
            itemSize={120}
            width="100%"
          >
            {Row}
          </List>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredEvents.length} of {events.length} total events
      </div>
    </div>
  );
});