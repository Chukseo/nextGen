/**
 * Geolocation and Country Reader Analytics Utilities
 */

// Helper to convert 2-letter ISO country code to Flag Emoji
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const code = countryCode.toUpperCase();
  if (code === 'XX' || code === 'ZZ' || code === 'T1') return '🌐';
  try {
    const c0 = 127397 + code.charCodeAt(0);
    const c1 = 127397 + code.charCodeAt(1);
    return String.fromCodePoint(c0, c1);
  } catch {
    return '🌐';
  }
}

// Helper to get friendly English country name from 2-letter ISO code
export function getCountryName(countryCode: string): string {
  if (!countryCode) return 'International / Other';
  const code = countryCode.toUpperCase();
  if (code === 'XX' || code === 'ZZ' || code === 'T1' || code === 'UNKNOWN') {
    return 'International / Other';
  }

  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const name = regionNames.of(code);
    if (name) return name;
  } catch {
    // Fallback dictionary for common regions
  }

  const fallbackMap: Record<string, string> = {
    NG: 'Nigeria',
    GB: 'United Kingdom',
    US: 'United States',
    CA: 'Canada',
    DE: 'Germany',
    FR: 'France',
    IN: 'India',
    ZA: 'South Africa',
    GH: 'Ghana',
    KE: 'Kenya',
    AU: 'Australia',
    NL: 'Netherlands',
    BR: 'Brazil',
    JP: 'Japan',
    CN: 'China',
    IT: 'Italy',
    ES: 'Spain',
    SE: 'Sweden',
    CH: 'Switzerland',
    EG: 'Egypt',
    IE: 'Ireland',
    SG: 'Singapore',
    MY: 'Malaysia',
  };

  return fallbackMap[code] || code;
}

// Map common IANA timezones to 2-letter country codes for instant zero-latency client fallback
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Africa/Lagos': 'NG',
  'Africa/Abidjan': 'CI',
  'Africa/Accra': 'GH',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Cairo': 'EG',
  'Africa/Casablanca': 'MA',
  'Africa/Johannesburg': 'ZA',
  'Africa/Nairobi': 'KE',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
  'Europe/London': 'GB',
  'Europe/Belfast': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL',
  'Europe/Stockholm': 'SE',
  'Europe/Zurich': 'CH',
  'Asia/Dubai': 'AE',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Singapore': 'SG',
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
};

export function getCountryFromTimezone(tz?: string): string | null {
  if (!tz) return null;
  return TIMEZONE_TO_COUNTRY[tz] || null;
}

export interface CountryViewStat {
  code: string;
  country: string;
  flag: string;
  count: number;
  percentage: number;
}

/**
 * Parses a stored countryViews JSON string into a sorted array of stats
 */
export function parseCountryViews(rawJson?: string | null, totalViews?: number): CountryViewStat[] {
  if (!rawJson) return [];

  let map: Record<string, number> = {};
  try {
    const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    if (typeof parsed === 'object' && parsed !== null) {
      for (const [key, val] of Object.entries(parsed)) {
        if (typeof val === 'number') {
          map[key.toUpperCase()] = val;
        } else if (typeof val === 'object' && val !== null && 'count' in val) {
          map[key.toUpperCase()] = Number((val as any).count) || 1;
        }
      }
    }
  } catch {
    return [];
  }

  const entries = Object.entries(map);
  if (entries.length === 0) {
    if (totalViews && totalViews > 0) {
      return [
        {
          code: 'GB',
          country: 'United Kingdom',
          flag: '🇬🇧',
          count: totalViews,
          percentage: 100,
        },
      ];
    }
    return [];
  }

  const recordedTotal = entries.reduce((sum, [, count]) => sum + count, 0);
  const effectiveTotal = Math.max(totalViews || 0, recordedTotal, 1);

  const stats: CountryViewStat[] = entries.map(([code, count]) => {
    return {
      code,
      country: getCountryName(code),
      flag: getCountryFlag(code),
      count,
      percentage: Math.min(100, Math.round((count / effectiveTotal) * 100)),
    };
  });

  // Sort descending by count, then alphabetical
  stats.sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));

  return stats;
}
