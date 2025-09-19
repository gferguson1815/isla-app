import { format } from 'date-fns';

export interface AnalyticsData {
  timestamp: string;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  device: string;
  browser: string;
  browserVersion?: string | null;
  os: string;
  osVersion?: string | null;
  referrer?: string | null;
  referrerType?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export function generateCSV(data: AnalyticsData[]): string {
  const headers = [
    'Timestamp',
    'Country',
    'City',
    'Region',
    'Device',
    'Browser',
    'Browser Version',
    'OS',
    'OS Version',
    'Referrer',
    'Referrer Type',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
  ];

  const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map(event => {
    return [
      format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      event.country || '',
      event.city || '',
      event.region || '',
      event.device,
      event.browser,
      event.browserVersion || '',
      event.os,
      event.osVersion || '',
      event.referrer || '',
      event.referrerType || '',
      event.utmSource || '',
      event.utmMedium || '',
      event.utmCampaign || '',
    ].map(escapeCSVField).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function streamCSV(
  data: AsyncIterable<AnalyticsData[]>,
  onChunk: (chunk: string) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      let isFirst = true;

      for await (const chunk of data) {
        if (isFirst) {
          const headers = [
            'Timestamp',
            'Country',
            'City',
            'Region',
            'Device',
            'Browser',
            'Browser Version',
            'OS',
            'OS Version',
            'Referrer',
            'Referrer Type',
            'UTM Source',
            'UTM Medium',
            'UTM Campaign',
          ].join(',');
          onChunk(headers + '\n');
          isFirst = false;
        }

        const rows = chunk.map(event => {
          return [
            format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss'),
            event.country || '',
            event.city || '',
            event.region || '',
            event.device,
            event.browser,
            event.browserVersion || '',
            event.os,
            event.osVersion || '',
            event.referrer || '',
            event.referrerType || '',
            event.utmSource || '',
            event.utmMedium || '',
            event.utmCampaign || '',
          ]
            .map(field => {
              if (field === null || field === undefined) return '';
              const str = String(field);
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(',');
        }).join('\n');

        if (rows) {
          onChunk(rows + '\n');
        }
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}