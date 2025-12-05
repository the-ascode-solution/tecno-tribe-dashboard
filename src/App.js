import './App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDashboardData } from './api';

const PIE_COLORS = ['#0363f9', '#e47759', '#ff8ccf', '#3d9a46', '#bed0ff'];
const LOCATION_COLOR_OVERRIDES = {
  kpk: '#f4c542',
};

const SunIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const CrescentIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 14.5A8.38 8.38 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
  </svg>
);

const LOGIN_ENDPOINTS = [
  '/.netlify/functions/login',
  '/api/login',
  'http://localhost:5000/api/login',
];

const HIDDEN_FIELDS = [
  'Ambassador',
  'Ambassador Benefits',
  'Interested in Ambassdor',
  'Interested in Ambassador',
  'ambassador strengths',
  'ambassador strengths other',
  'ambassador benfits',
  'ambassador benefits other',
  'name',
  'social media link',
  'follower count',
  'suggestions',
];

const HIDDEN_FIELD_SET = new Set(HIDDEN_FIELDS.map(normalizeFieldName));
const GENDER_FIELD_KEYS = new Set(['gender', 'sex']);
const LOCATION_FIELD_KEYS = new Set([
  'city',
  'location',
  'province',
  'state',
  'district',
  'region',
  'area',
  'address',
  'residence',
]);
const AGE_FIELD_KEYS = new Set([
  'age',
  'age group',
  'age range',
  'agegroup',
  'age-range',
  'agegroup',
]);
const BRAND_FIELD_KEYS = new Set([
  'brand',
  'phone brand',
  'phonebrand',
  'mobile brand',
  'device brand',
  'preferred brand',
  'smartphone brand',
  'phone model',
  'device model',
  'current phone brand',
]);
const BUDGET_FIELD_KEYS = new Set([
  'budget',
  'budget range',
  'price range',
  'expected budget',
  'device budget',
  'monthly budget',
  'average budget',
  'phone budget',
]);
const COLOR_FIELD_KEYS = new Set([
  'favorite color',
  'favourite color',
  'preferred color',
  'color',
  'colour',
  'phone color',
  'preferred phone colors',
]);
const COLOR_SECONDARY_FIELD_KEYS = new Set([
  'preferred phone colors secondary',
]);
const TECH_SOURCE_FIELD_KEYS = new Set([
  'tech update sources',
  'tech update source',
  'tech updates sources',
  'tech updates source',
  'technology update sources',
  'technology update source',
]);
const TOP_PHONE_FUNCTION_FIELD_KEYS = new Set([
  'top phone functions',
  'top phone function',
  'phone functions',
  'phone function priorities',
  'priority phone functions',
  'top smartphone functions',
]);
const SOCIAL_PLATFORM_FIELD_KEYS = new Set([
  'social media platforms',
  'social media platform',
  'social media paltforms',
  'social platforms',
  'social platform',
  'preferred social media platform',
  'social media account',
  'social media accounts',
]);
const SOCIAL_TIME_FIELD_KEYS = new Set([
  'time spent on social media',
  'time spent social media',
  'time spent',
  'time spent on social-media',
]);
const PHONE_CHANGE_FIELD_KEYS = new Set([
  'phone change frequency',
  'phone change freq',
  'phone change',
  'how often do you change your phone',
  'phone upgrade frequency',
]);
const TECNO_EXPERIENCE_FIELD_KEYS = new Set([
  'tecno experience',
  'experience with tecno',
  'experience using tecno',
  'tecno brand experience',
]);
const FOLLOWS_TECH_CONTENT_FIELD_KEYS = new Set([
  'follows tech content',
  'follow tech content',
  'following tech content',
  'tech content follower',
]);
const RAW_SOCIAL_PLATFORM_DEFINITIONS = [
  { label: 'Instagram', keywords: ['instagram', 'insta', 'ig'] },
  { label: 'Facebook', keywords: ['facebook', 'fb'] },
  { label: 'YouTube', keywords: ['youtube', 'you tube', 'yt'] },
  { label: 'TikTok', keywords: ['tiktok', 'tik tok'] },
  { label: 'Snapchat', keywords: ['snapchat'] },
];
const SOCIAL_PLATFORM_DEFINITIONS = RAW_SOCIAL_PLATFORM_DEFINITIONS.map((def) => ({
  label: def.label,
  normalizedKeywords: def.keywords.map((keyword) => normalizeSocialText(keyword)),
}));

const DATE_FIELD_NAMES = [
  'createdAt','created_at',
  'updatedAt','updated_at',
  'submittedAt','submitted_at',
  'timestamp','Timestamp',
  'submissionDate','submission_date',
  'date','Date',
  'time','Time',
];

function normalizeFieldName(value) {
  return (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFilterValue(value) {
  if (value === null || value === undefined) return '';
  if (value === true) return 'true';
  if (value === false) return 'false';
  return value.toString().trim().toLowerCase();
}

function normalizeSocialText(value) {
  return (value ?? '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function coerceSocialValues(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => coerceSocialValues(entry));
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entryValue]) => {
      if (typeof entryValue === 'boolean') {
        return entryValue ? [key] : [];
      }
      if (entryValue === null || entryValue === undefined) {
        return [];
      }
      return coerceSocialValues(entryValue);
    });
  }
  return [value];
}

function extractSocialPlatforms(value) {
  const rawValues = coerceSocialValues(value);
  if (!rawValues.length) return [];

  const matches = new Set();

  rawValues.forEach((entry) => {
    if (entry === null || entry === undefined) return;
    const text = entry.toString();
    const segments = text
      .split(/[,/|;]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    const parts = segments.length ? segments : [text.trim()].filter(Boolean);
    parts.forEach((part) => {
      const normalized = normalizeSocialText(part);
      if (!normalized) return;
      SOCIAL_PLATFORM_DEFINITIONS.forEach((definition) => {
        const isMatch = definition.normalizedKeywords.some((keyword) => normalized.includes(keyword));
        if (isMatch) {
          matches.add(definition.label);
        }
      });
    });
  });

  return Array.from(matches);
}

function extractDelimitedLabels(value) {
  const rawValues = coerceSocialValues(value);
  if (!rawValues.length) return [];

  const matches = new Set();

  rawValues.forEach((entry) => {
    if (entry === null || entry === undefined) return;
    const text = entry.toString();
    const segments = text
      .split(/[,/|;]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    const parts = segments.length ? segments : [text.trim()].filter(Boolean);
    parts.forEach((part) => {
      const normalized = formatBrandLabel(part);
      if (!normalized || normalized === 'Unspecified') return;
      matches.add(normalized);
    });
  });

  return Array.from(matches);
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isNaN(ts) ? null : ts;
  }
  if (typeof value === 'string') {
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? null : ts;
  }
  if (typeof value === 'number') {
    if (value > 1e12) return value;
    if (value > 1e9) return value * 1000;
    return null;
  }
  if (typeof value === 'object') {
    if ('$date' in value) return parseDateValue(value.$date);
    if ('seconds' in value) return value.seconds * 1000;
  }
  return null;
}

function collectDateCandidates(source) {
  if (!source || typeof source !== 'object') return [];
  return DATE_FIELD_NAMES.map((key) => source[key]).filter(Boolean);
}

function getDocTime(doc) {
  const candidates = [
    ...collectDateCandidates(doc),
    ...collectDateCandidates(doc?.timestamps),
    ...collectDateCandidates(doc?.metadata),
  ];
  if (doc?.data && typeof doc.data === 'object') {
    candidates.push(...collectDateCandidates(doc.data));
  }
  for (const value of candidates) {
    const parsed = parseDateValue(value);
    if (parsed) return parsed;
  }
  const id = doc?._id;
  if (typeof id === 'string' && id.length >= 8) {
    const hex = id.slice(0, 8);
    const ts = parseInt(hex, 16);
    if (!Number.isNaN(ts)) return ts * 1000;
  }
  if (typeof id === 'object' && typeof id?.$oid === 'string') {
    const hex = id.$oid.slice(0, 8);
    const ts = parseInt(hex, 16);
    if (!Number.isNaN(ts)) return ts * 1000;
  }
  return 0;
}

function getDocDate(doc) {
  const ts = getDocTime(doc);
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function getRowFields(doc) {
  if (!doc) return {};
  if (doc.fields && typeof doc.fields === 'object') return doc.fields;
  if (doc.data && typeof doc.data === 'object') return doc.data;
  return doc;
}

function getColumnFilterKey(collection, column) {
  return `${collection}::${column}`;
}

function getFilteredColumns(docs) {
  const seen = new Set();
  docs.forEach((doc) => {
    const fields = getRowFields(doc);
    Object.keys(fields).forEach((key) => {
      if (key.startsWith('_')) return;
      if (HIDDEN_FIELD_SET.has(normalizeFieldName(key))) return;
      seen.add(key);
    });
  });
  return Array.from(seen);
}

function formatFieldValue(value, { truncate = true } = {}) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '(empty)';
    if (!truncate || trimmed.length <= 60) return trimmed;
    return `${trimmed.slice(0, 60)}…`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length === 1) return formatFieldValue(value[0], { truncate });
    return `${value.length} items`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    return keys.map((k) => `${k}: ${formatFieldValue(value[k], { truncate: false })}`).join(', ');
  }
  return String(value);
}

function formatNiceLabel(value) {
  return (value || '')
    .toString()
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)([a-z])/g, (_, space, char) => `${space}${char.toUpperCase()}`);
}

function prepareObjectEntries(value) {
  const entries = Object.entries(value || {});
  const enriched = entries.map(([key, raw]) => {
    const numeric = typeof raw === 'number' ? raw : Number(raw);
    return {
      key,
      value: raw,
      sortableValue: Number.isFinite(numeric) ? numeric : null,
    };
  });
  const hasNumeric = enriched.some((entry) => entry.sortableValue !== null);
  if (hasNumeric) {
    enriched.sort((a, b) => {
      const av = a.sortableValue ?? Number.POSITIVE_INFINITY;
      const bv = b.sortableValue ?? Number.POSITIVE_INFINITY;
      return av - bv;
    });
  } else {
    enriched.sort((a, b) => a.key.localeCompare(b.key));
  }
  return enriched;
}

function renderCellValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const entries = prepareObjectEntries(value);
    return (
      <div className="cell-row">
        {entries.map((entry) => (
          <div key={entry.key} className="chip-inline">
            <span className="chip-label">{formatNiceLabel(entry.key)}</span>
            <span className="chip-value">{formatFieldValue(entry.value, { truncate: false })}</span>
          </div>
        ))}
      </div>
    );
  }
  return formatFieldValue(value);
}

function formatLocationLabel(value) {
  if (value === null || value === undefined) return 'Unspecified';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'Unspecified';
    return trimmed
      .toLowerCase()
      .replace(/(^|\s)([a-z])/g, (_, space, char) => `${space}${char.toUpperCase()}`)
      .replace(/\s+/g, ' ');
  }
  return String(value);
}

function formatAgeLabel(value) {
  if (value === null || value === undefined) return 'Unknown';
  if (typeof value === 'number') {
    return `${value}`;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'Unknown';
    return trimmed.replace(/\s+/g, ' ');
  }
  return String(value);
}

function formatBrandLabel(value) {
  if (value === null || value === undefined) return 'Unspecified';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'Unspecified';
    return trimmed
      .toLowerCase()
      .replace(/(^|\s)([a-z])/g, (_, space, char) => `${space}${char.toUpperCase()}`)
      .replace(/\s+/g, ' ');
  }
  return String(value);
}

function formatGenderLabel(value) {
  if (value === null || value === undefined) return 'Unknown';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'Unknown';
    return trimmed
      .toLowerCase()
      .replace(/(^|\s)([a-z])/g, (_, space, char) => `${space}${char.toUpperCase()}`)
      .replace(/\s+/g, ' ');
  }
  return String(value);
}

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const radians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'L', cx, cy,
    'Z',
  ].join(' ');
}

function buildPieSlices(rows, total, maxSlices = PIE_COLORS.length) {
  if (!total) return [];
  let workingRows = rows;
  if (rows.length > maxSlices) {
    const primary = rows.slice(0, maxSlices - 1);
    const remainderCount = rows.slice(maxSlices - 1).reduce((sum, row) => sum + row.count, 0);
    workingRows = [...primary, { label: 'Other', count: remainderCount }];
  }
  let startAngle = 0;
  return workingRows.map((row, index) => {
    const percent = total ? (row.count / total) * 100 : 0;
    const angle = (percent / 100) * 360;
    const endAngle = startAngle + angle;
    const path = describeArc(60, 60, 58, startAngle, endAngle);
    const slice = {
      ...row,
      percent,
      path,
      color: PIE_COLORS[index % PIE_COLORS.length],
    };
    startAngle = endAngle;
    return slice;
  });
}

function formatDateLabel(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

async function authenticateAdmin({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const body = JSON.stringify({ email, password });
  let lastError = null;

  for (const url of LOGIN_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.ok) {
        return payload;
      }

      const message = payload?.error || `Login failed (${res.status})`;
      throw new Error(message);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to authenticate. Please try again.');
}

const COLUMN_FILTER_ALL = '__all__';
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000; // refresh data every 3 hours to keep filters up to date

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState({});
  const [activeTab, setActiveTab] = useState('surveys'); // 'surveys' | 'analytics'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showPassword, setShowPassword] = useState(false);
  const [sortOption, setSortOption] = useState('name-asc');
  const [filterDate, setFilterDate] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedTheme = window.localStorage.getItem('dashboard-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
      return;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);
    try {
      window.localStorage.setItem('dashboard-theme', theme);
    } catch (_) {
      /* no-op */
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('isAuthed');
    if (stored === 'true') setIsAuthed(true);
  }, []);

  const loadData = useCallback((showSpinner = true) => {
    if (!isAuthed) return;
    if (showSpinner) {
      setLoading(true);
      setError('');
    }

    fetchDashboardData()
      .then((json) => {
        setData(json);
        if (json.status === 'no-db') {
          setError('MongoDB not configured. Please set up your database connection.');
        } else if (json.status === 'error') {
          setError(json.error || 'Database connection failed.');
        }
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => {
        if (showSpinner) setLoading(false);
      });
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    loadData();
  }, [isAuthed, loadData]);

  useEffect(() => {
    if (!isAuthed) return;
    const id = setInterval(() => loadData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthed, loadData]);

  const baseCollections = useMemo(() => {
    if (!data || !data.collections) return [];
    return data.collections.filter((c) => c.collection.toLowerCase() !== 'sessions');
  }, [data]);

  const collections = useMemo(() => {
    let list = baseCollections;
    if (activeTab === 'surveys') {
      list = list.filter((c) => c.collection.toLowerCase().includes('survey'));
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c => c.collection.toLowerCase().includes(q));
    }

    const sortable = [...list];
    sortable.sort((a, b) => {
      const nameA = a.collection.toLowerCase();
      const nameB = b.collection.toLowerCase();
      const countA = typeof a.count === 'number' ? a.count : (a.docs?.length || 0);
      const countB = typeof b.count === 'number' ? b.count : (b.docs?.length || 0);
      switch (sortOption) {
        case 'name-desc':
          return nameB.localeCompare(nameA);
        case 'count-asc':
          return countA - countB;
        case 'count-desc':
          return countB - countA;
        case 'name-asc':
        default:
          return nameA.localeCompare(nameB);
      }
    });

    return sortable
      .map((c) => {
        const docs = (c.docs || []).slice().sort((a, b) => getDocTime(a) - getDocTime(b));
        const displayDocs = filterDate ? docs.filter((doc) => getDocDate(doc) === filterDate) : docs;
        return { ...c, displayDocs };
      })
      .filter((c) => !filterDate || (c.displayDocs && c.displayDocs.length > 0));
  }, [baseCollections, query, activeTab, sortOption, filterDate]);

  const tableCollections = useMemo(() => {
    return collections.map((c) => {
      const docs = c.displayDocs || [];
      const columns = getFilteredColumns(docs);
      const columnValueMap = columns.reduce((acc, col) => {
        const values = new Set();
        docs.forEach((row) => {
          const fields = getRowFields(row);
          values.add(normalizeFilterValue(fields[col]));
        });
        acc[col] = Array.from(values).sort((a, b) => a.localeCompare(b));
        return acc;
      }, {});

      const visibleDocs = docs.filter((row) => {
        const fields = getRowFields(row);
        return columns.every((col) => {
          const key = getColumnFilterKey(c.collection, col);
          const selected = columnFilters[key];
          if (!selected) return true;
          return normalizeFilterValue(fields[col]) === selected;
        });
      });

      return { ...c, columns, columnValueMap, visibleDocs };
    });
  }, [collections, columnFilters]);

  const totalDocs = useMemo(() => {
    return collections.reduce((acc, c) => acc + (c.displayDocs?.length || 0), 0);
  }, [collections]);

  const dailyCounts = useMemo(() => {
    const map = new Map();
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const date = getDocDate(doc);
        if (!date) return;
        map.set(date, (map.get(date) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, count]) => ({ date, count }));
  }, [baseCollections]);

  const genderStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!GENDER_FIELD_KEYS.has(normalized)) return;
          const label = formatGenderLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });
    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return { total, rows };
  }, [baseCollections]);

  const followsTechContentStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!FOLLOWS_TECH_CONTENT_FIELD_KEYS.has(normalized)) return;
          const label = formatBrandLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total, rows };
  }, [baseCollections]);

  const tecnoExperienceStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!TECNO_EXPERIENCE_FIELD_KEYS.has(normalized)) return;
          const label = formatBrandLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total, rows };
  }, [baseCollections]);

  const phoneChangeStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!PHONE_CHANGE_FIELD_KEYS.has(normalized)) return;
          const label = formatBrandLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total, rows };
  }, [baseCollections]);

  const socialStats = useMemo(() => {
    const counts = new Map();
    RAW_SOCIAL_PLATFORM_DEFINITIONS.forEach((def) => counts.set(def.label, 0));

    let totalSelections = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!SOCIAL_PLATFORM_FIELD_KEYS.has(normalized)) return;
          const platforms = extractSocialPlatforms(value);
          if (!platforms.length) return;
          platforms.forEach((platform) => {
            if (!counts.has(platform)) return;
            counts.set(platform, counts.get(platform) + 1);
            totalSelections += 1;
          });
        });
      });
    });

    const rows = RAW_SOCIAL_PLATFORM_DEFINITIONS.map((def) => {
      const count = counts.get(def.label) || 0;
      return {
        label: def.label,
        count,
        percent: totalSelections ? (count / totalSelections) * 100 : 0,
      };
    }).filter((row) => row.count > 0);

    return { total: totalSelections, rows };
  }, [baseCollections]);

  const phoneFunctionStats = useMemo(() => {
    const counts = new Map();
    let totalSelections = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!TOP_PHONE_FUNCTION_FIELD_KEYS.has(normalized)) return;
          const functions = extractDelimitedLabels(value);
          if (!functions.length) return;
          functions.forEach((fn) => {
            counts.set(fn, (counts.get(fn) || 0) + 1);
            totalSelections += 1;
          });
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: totalSelections ? (count / totalSelections) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total: totalSelections, rows };
  }, [baseCollections]);

  const socialTimeStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!SOCIAL_TIME_FIELD_KEYS.has(normalized)) return;
          const label = formatBrandLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total, rows };
  }, [baseCollections]);

  const locationStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!LOCATION_FIELD_KEYS.has(normalized)) return;
          const label = formatLocationLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total, rows };
  }, [baseCollections]);

  const topLocationRows = useMemo(() => locationStats.rows.slice(0, 5), [locationStats]);

  const maxLocationPercent = useMemo(() => {
    if (!topLocationRows.length) return 0;
    return topLocationRows.reduce((max, row) => Math.max(max, row.percent), 0);
  }, [topLocationRows]);

  const ageStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!AGE_FIELD_KEYS.has(normalized)) return;
          const label = formatAgeLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total, rows };
  }, [baseCollections]);

  const topAgeRows = useMemo(() => ageStats.rows.slice(0, 5), [ageStats]);

  const maxAgePercent = useMemo(() => {
    if (!topAgeRows.length) return 0;
    return topAgeRows.reduce((max, row) => Math.max(max, row.percent), 0);
  }, [topAgeRows]);

  const techSourceStats = useMemo(() => {
    const counts = new Map();
    let totalSelections = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!TECH_SOURCE_FIELD_KEYS.has(normalized)) return;
          const sources = extractDelimitedLabels(value);
          if (!sources.length) return;
          sources.forEach((source) => {
            counts.set(source, (counts.get(source) || 0) + 1);
            totalSelections += 1;
          });
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: totalSelections ? (count / totalSelections) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total: totalSelections, rows };
  }, [baseCollections]);

  const brandStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!BRAND_FIELD_KEYS.has(normalized)) return;
          const label = formatBrandLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });

    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total, rows };
  }, [baseCollections]);

  const MAX_BRAND_SLICES = 5;
  const brandPieRows = useMemo(() => {
    if (!brandStats.total) return [];
    if (brandStats.rows.length <= MAX_BRAND_SLICES) return brandStats.rows;
    const primary = brandStats.rows.slice(0, MAX_BRAND_SLICES - 1);
    const primaryTotal = primary.reduce((sum, row) => sum + row.count, 0);
    const remainder = brandStats.total - primaryTotal;
    return [...primary, { label: 'Other', count: remainder, percent: (remainder / brandStats.total) * 100 }];
  }, [brandStats]);

  const brandPieSlices = useMemo(() => buildPieSlices(brandPieRows, brandStats.total), [brandPieRows, brandStats.total]);

  const budgetStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!BUDGET_FIELD_KEYS.has(normalized)) return;
          const label = formatBrandLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });
    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    return { total, rows };
  }, [baseCollections]);

  const colorStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!COLOR_FIELD_KEYS.has(normalized)) return;
          const label = formatBrandLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });
    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    return { total, rows };
  }, [baseCollections]);

  const colorSecondaryStats = useMemo(() => {
    const counts = new Map();
    let total = 0;
    baseCollections.forEach((c) => {
      (c.docs || []).forEach((doc) => {
        const fields = getRowFields(doc);
        Object.entries(fields).forEach(([key, value]) => {
          const normalized = normalizeFieldName(key);
          if (!COLOR_SECONDARY_FIELD_KEYS.has(normalized)) return;
          const label = formatBrandLabel(value);
          counts.set(label, (counts.get(label) || 0) + 1);
          total += 1;
        });
      });
    });
    const rows = Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    return { total, rows };
  }, [baseCollections]);

  const BUDGET_PIE_MAX = 5;
  const budgetPieSlices = useMemo(() => buildPieSlices(budgetStats.rows, budgetStats.total, BUDGET_PIE_MAX), [budgetStats]);
  const colorPieSlices = useMemo(() => buildPieSlices(colorStats.rows, colorStats.total, BUDGET_PIE_MAX), [colorStats]);
  const colorSecondaryPieSlices = useMemo(
    () => buildPieSlices(colorSecondaryStats.rows, colorSecondaryStats.total, BUDGET_PIE_MAX),
    [colorSecondaryStats],
  );
  const socialTimePieSlices = useMemo(
    () => buildPieSlices(socialTimeStats.rows, socialTimeStats.total, BUDGET_PIE_MAX),
    [socialTimeStats],
  );
  const phoneChangePieSlices = useMemo(
    () => buildPieSlices(phoneChangeStats.rows, phoneChangeStats.total, BUDGET_PIE_MAX),
    [phoneChangeStats],
  );
  const tecnoExperiencePieSlices = useMemo(
    () => buildPieSlices(tecnoExperienceStats.rows, tecnoExperienceStats.total, BUDGET_PIE_MAX),
    [tecnoExperienceStats],
  );
  const followsTechContentPieSlices = useMemo(
    () => buildPieSlices(followsTechContentStats.rows, followsTechContentStats.total, BUDGET_PIE_MAX),
    [followsTechContentStats],
  );

  const genderPieSlices = useMemo(() => {
    if (!genderStats.total) return [];
    let startAngle = 0;
    return genderStats.rows.map((row, index) => {
      const angle = (row.percent / 100) * 360;
      const endAngle = startAngle + angle;
      const path = describeArc(60, 60, 58, startAngle, endAngle);
      const slice = {
        ...row,
        path,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
      startAngle = endAngle;
      return slice;
    });
  }, [genderStats]);

  const sortSelectValue = filterDate ? `date:${filterDate}` : sortOption;

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    try {
      setAuthenticating(true);
      await authenticateAdmin({ email: normalizedEmail, password });
      setIsAuthed(true);
      sessionStorage.setItem('isAuthed', 'true');
    } catch (loginError) {
      setError(loginError.message || 'Invalid credentials');
    } finally {
      setAuthenticating(false);
    }
  }

  function handleLogout() {
    setIsAuthed(false);
    sessionStorage.removeItem('isAuthed');
    setData(null);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setFilterDate(null);
    setSortOption('name-asc');
    setColumnFilters({});
  }

  function handleSortChange(value) {
    if (value.startsWith('date:')) {
      const [, selectedDate] = value.split(':');
      setFilterDate(selectedDate || null);
    } else {
      setFilterDate(null);
      setSortOption(value);
    }
  }

  function handleColumnFilterChange(collection, column, value) {
    const key = getColumnFilterKey(collection, column);
    setColumnFilters((prev) => {
      if (value === COLUMN_FILTER_ALL) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  }

  if (!isAuthed) {
    return (
      <div className="centered">
        <div className="card auth-card fade-in">
          <div className="brand" style={{ marginBottom: 8 }}>
            <div className="brand-badge" /> Tecno Survey
          </div>
          <h1 className="title">Welcome back</h1>
          <div className="subtitle">Sign in to view your dashboard</div>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="enter your email" required />
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="enter password"
                  required
                  style={{ width: '100%', paddingRight: 48, boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 10,
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 6,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#555'
                  }}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                      <path d="M16.24 16.24A9.5 9.5 0 0112 18c-5 0-9-4.5-9-6 0-.7 1.25-2.54 3.5-4.19" />
                      <path d="M14.12 5.18A9.77 9.77 0 0112 5c-5 0-9 4.5-9 6 0 .39.33 1.18.97 2.05" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div className="hint">Use the provided admin credentials</div>
              <button type="submit" className="btn" disabled={authenticating}>
                {authenticating ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="brand"><div className="brand-badge" /> TECNO SURVEY Dashboard</div>
          <div className="tabs">
            <button className={`tab ${activeTab === 'surveys' ? 'tab-active' : ''}`} onClick={() => setActiveTab('surveys')}>Surveys</button>
            <button className={`tab ${activeTab === 'analytics' ? 'tab-active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className="input" placeholder="Search collections…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select
              className="input"
              value={sortSelectValue}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{ minWidth: 180 }}
              aria-label="Sort collections or filter by date"
            >
              <optgroup label="Sort by">
                <option value="name-asc">Name · A → Z</option>
                <option value="name-desc">Name · Z → A</option>
                <option value="count-desc">Documents · High → Low</option>
                <option value="count-asc">Documents · Low → High</option>
              </optgroup>
              {dailyCounts.length > 0 && (
                <optgroup label="Filter by date">
                  {dailyCounts.map(({ date, count }) => (
                    <option key={date} value={`date:${date}`}>
                      {formatDateLabel(date)} · {count} submission{count === 1 ? '' : 's'}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className="segmented">
              <button className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>Cards</button>
              <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
            </div>
            <button
              className="btn-secondary btn theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark (crescent)' : 'light (sun)'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark (crescent)' : 'light (sun)'} mode`}
            >
              {theme === 'light' ? (
                <>
                  <SunIcon />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <CrescentIcon />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <button className="btn-secondary btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="statbar">
          <div className="stat">
            <div className="label">Collections</div>
            <div className="value">{collections.length}</div>
          </div>
          <div className="stat">
            <div className="label">Total documents (visible)</div>
            <div className="value">{totalDocs}</div>
          </div>
          <div className="stat">
            <div className="label">Status</div>
            <div className="value" style={{ 
              color: loading ? '#ffda6c' : 
                     data?.status === 'connected' ? '#1ad1a5' :
                     data?.status === 'no-db' ? '#ff6b6b' :
                     data?.status === 'error' ? '#ff6b6b' : '#ffda6c'
            }}>
              {loading ? 'Loading…' : 
               data?.status === 'connected' ? 'Connected' :
               data?.status === 'no-db' ? 'No DB Config' :
               data?.status === 'error' ? 'Error' : 'Unknown'}
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {!loading && collections.length === 0 && (
          <div className="card">No collections found or database is empty.</div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-grid fade-in">
            <div className="card analytics-card submissions-card">
              <div className="coll-header" style={{ marginBottom: 8 }}>
                <div className="coll-name">Daily form submissions</div>
                <div className="coll-actions">
                  <span className="label">Tracking {dailyCounts.length} day{dailyCounts.length === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="table-wrap mini">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Forms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyCounts.length === 0 ? (
                      <tr>
                        <td colSpan={2}>No submissions found.</td>
                      </tr>
                    ) : (
                      dailyCounts.map((row) => (
                        <tr key={row.date}>
                          <td>{new Date(row.date).toLocaleDateString()}</td>
                          <td>{row.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card analytics-card location-card">
              <div className="coll-header" style={{ marginBottom: 8 }}>
                <div className="coll-name">Location distribution</div>
                <div className="coll-actions">
                  <span className="label">{locationStats.total} tagged entries</span>
                </div>
              </div>
              {locationStats.total === 0 ? (
                <div className="hint">No location field detected in current data.</div>
              ) : (
                <>
                  <div className="location-table">
                    <div className="table-wrap mini">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Location</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {locationStats.rows.map((row) => (
                            <tr key={row.label}>
                              <td>{row.label}</td>
                              <td>{row.percent.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {topLocationRows.length > 0 && (
                    <div className="location-chart location-chart-horizontal" role="img" aria-label="Top locations bar chart">
                      <div className="location-chart-head">
                        <span className="location-chart-title">Top locations</span>
                        <span className="label">By percentage share</span>
                      </div>
                      <div className="location-bars horizontal">
                        {topLocationRows.map((row, index) => {
                          const ratio = maxLocationPercent ? row.percent / maxLocationPercent : 0;
                          const widthPercent = Math.max(ratio * 100, 10);
                          const normalizedLabel = (row.label || '').trim().toLowerCase();
                          const barColor = LOCATION_COLOR_OVERRIDES[normalizedLabel] || PIE_COLORS[index % PIE_COLORS.length];
                          return (
                            <div key={row.label} className="location-bar horizontal">
                              <span className="location-bar-label">{row.label}</span>
                              <div className="location-bar-track" aria-hidden="true">
                                <div
                                  className="location-bar-fill"
                                  style={{
                                    width: `${widthPercent}%`,
                                    background: barColor,
                                  }}
                                />
                              </div>
                              <span className="location-bar-value">{row.percent.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                      {locationStats.rows.length > topLocationRows.length && (
                        <div className="location-chart-note">
                          Showing top {topLocationRows.length} of {locationStats.rows.length} locations
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="card analytics-card gender-card">
              <div className="coll-header" style={{ marginBottom: 8 }}>
                <div className="coll-name">Gender distribution</div>
                <div className="coll-actions">
                  <span className="label">{genderStats.total} responses</span>
                </div>
              </div>
              {genderStats.total === 0 ? (
                <div className="hint">No gender field found in current data.</div>
              ) : (
                <div className="gender-grid">
                  <div className="table-wrap mini gender-table">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Gender</th>
                          <th>Responses</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {genderStats.rows.map((row) => (
                          <tr key={row.label}>
                            <td>{row.label}</td>
                            <td>{row.count}</td>
                            <td>{row.percent.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="gender-chart">
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                      <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                      {genderPieSlices.map((slice) => (
                        <path key={slice.label} d={slice.path} fill={slice.color} />
                      ))}
                      <circle cx="60" cy="60" r="30" fill="#ffffff" />
                      <text x="60" y="66" textAnchor="middle" className="chart-label">GENDER</text>
                    </svg>
                    <div className="gender-legend">
                      {genderPieSlices.map((slice) => (
                        <div key={slice.label} className="legend-row">
                          <span className="dot" style={{ background: slice.color }} />
                          <span className="legend-label">{slice.label}</span>
                          <strong>{slice.percent.toFixed(1)}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card analytics-card age-card">
              <div className="coll-header" style={{ marginBottom: 8 }}>
                <div className="coll-name">Age insights</div>
                <div className="coll-actions">
                  <span className="label">{ageStats.total} tagged entries</span>
                </div>
              </div>
              {ageStats.total === 0 ? (
                <div className="hint">No age field detected in current data.</div>
              ) : (
                <>
                  <div className="table-wrap mini">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Age</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ageStats.rows.map((row) => (
                          <tr key={row.label}>
                            <td>{row.label}</td>
                            <td>{row.percent.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="age-chart" role="img" aria-label="Top age distribution bar chart">
                    <div className="age-bars">
                      {topAgeRows.map((row, index) => {
                        const ratio = maxAgePercent ? row.percent / maxAgePercent : 0;
                        const heightPercent = Math.max(ratio * 100, 12);
                        return (
                          <div key={row.label} className="age-bar">
                            <div className="age-bar-track" aria-hidden="true">
                              <div
                                className="age-bar-fill"
                                style={{
                                  height: `${heightPercent}%`,
                                  background: PIE_COLORS[index % PIE_COLORS.length],
                                }}
                              />
                            </div>
                            <span className="age-bar-value">{row.percent.toFixed(1)}%</span>
                            <span className="age-bar-label">{row.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {ageStats.rows.length > topAgeRows.length && (
                      <div className="age-chart-note">
                        Showing top {topAgeRows.length} of {ageStats.rows.length} ages
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="card analytics-card brand-card-full">
            <div className="brand-layout">
              <div className="table-wrap brand-table">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Phone brand</th>
                      <th>Entries</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandStats.rows.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '18px 0' }}>
                          No phone brand field detected in current data.
                        </td>
                      </tr>
                    ) : (
                      brandStats.rows.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td>{row.count}</td>
                          <td>{row.percent.toFixed(1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="brand-pie" role="img" aria-label="Phone brand pie chart">
                <div className="brand-section-title">Phone brand distribution</div>
                {brandStats.total === 0 ? (
                  <div className="hint" style={{ textAlign: 'center' }}>Add phone brand fields to see the chart.</div>
                ) : (
                  <>
                    <svg viewBox="0 0 120 120" className="brand-pie-chart">
                      <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                      {brandPieSlices.map((slice) => (
                        <path key={slice.label} d={slice.path} fill={slice.color} />
                      ))}
                      <circle cx="60" cy="60" r="30" fill="#fff" />
                      <text x="60" y="66" textAnchor="middle" className="chart-label">BRANDS</text>
                    </svg>
                    <div className="brand-legend">
                      {brandPieSlices.map((slice) => (
                        <div key={slice.label} className="legend-row">
                          <span className="dot" style={{ background: slice.color }} />
                          <span className="legend-label">{slice.label}</span>
                          <strong>{slice.percent.toFixed(1)}%</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="insight-grid">
            <div className="card insight-card">
              <div className="insight-title">Budget distribution</div>
              {budgetStats.total === 0 ? (
                <div className="hint">No budget field detected in current data.</div>
              ) : (
                <div className="insight-chart" role="img" aria-label="Budget distribution pie chart">
                  <svg viewBox="0 0 120 120" className="insight-pie">
                    <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                    {budgetPieSlices.map((slice) => (
                      <path key={slice.label} d={slice.path} fill={slice.color} />
                    ))}
                    <circle cx="60" cy="60" r="30" fill="#fff" />
                    <text x="60" y="66" textAnchor="middle" className="chart-label">BUDGET</text>
                  </svg>
                  <div className="insight-legend">
                    {budgetPieSlices.map((slice) => (
                      <div key={slice.label} className="legend-row">
                        <span className="dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                        <strong>{slice.percent.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="card insight-card">
              <div className="insight-title">Preferred colors</div>
              {colorStats.total === 0 ? (
                <div className="hint">No color field detected in current data.</div>
              ) : (
                <div className="insight-chart" role="img" aria-label="Color preference pie chart">
                  <svg viewBox="0 0 120 120" className="insight-pie">
                    <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                    {colorPieSlices.map((slice) => (
                      <path key={slice.label} d={slice.path} fill={slice.color} />
                    ))}
                    <circle cx="60" cy="60" r="30" fill="#fff" />
                    <text x="60" y="66" textAnchor="middle" className="chart-label">COLORS</text>
                  </svg>
                  <div className="insight-legend">
                    {colorPieSlices.map((slice) => (
                      <div key={slice.label} className="legend-row">
                        <span className="dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                        <strong>{slice.percent.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="card insight-card">
              <div className="insight-title">Secondary colors</div>
              {colorSecondaryStats.total === 0 ? (
                <div className="hint">No “Preferred phone colors secondary” field found.</div>
              ) : (
                <div className="insight-chart" role="img" aria-label="Secondary color preference pie chart">
                  <svg viewBox="0 0 120 120" className="insight-pie">
                    <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                    {colorSecondaryPieSlices.map((slice) => (
                      <path key={slice.label} d={slice.path} fill={slice.color} />
                    ))}
                    <circle cx="60" cy="60" r="30" fill="#fff" />
                    <text x="60" y="66" textAnchor="middle" className="chart-label">SECONDARY</text>
                  </svg>
                  <div className="insight-legend">
                    {colorSecondaryPieSlices.map((slice) => (
                      <div key={slice.label} className="legend-row">
                        <span className="dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                        <strong>{slice.percent.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="card insight-card">
              <div className="insight-title">Phone change frequency</div>
              {phoneChangeStats.total === 0 ? (
                <div className="hint">No "phone change frequency" field detected in current data.</div>
              ) : (
                <div className="insight-chart" role="img" aria-label="Phone change frequency pie chart">
                  <svg viewBox="0 0 120 120" className="insight-pie">
                    <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                    {phoneChangePieSlices.map((slice) => (
                      <path key={slice.label} d={slice.path} fill={slice.color} />
                    ))}
                    <circle cx="60" cy="60" r="30" fill="#fff" />
                    <text x="60" y="66" textAnchor="middle" className="chart-label">CHANGE</text>
                  </svg>
                  <div className="insight-legend">
                    {phoneChangePieSlices.map((slice) => (
                      <div key={slice.label} className="legend-row">
                        <span className="dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                        <strong>{slice.percent.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="card insight-card">
              <div className="insight-title">TECNO experience</div>
              {tecnoExperienceStats.total === 0 ? (
                <div className="hint">No "TECNO experience" field detected in current data.</div>
              ) : (
                <div className="insight-chart" role="img" aria-label="TECNO experience pie chart">
                  <svg viewBox="0 0 120 120" className="insight-pie">
                    <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                    {tecnoExperiencePieSlices.map((slice) => (
                      <path key={slice.label} d={slice.path} fill={slice.color} />
                    ))}
                    <circle cx="60" cy="60" r="30" fill="#fff" />
                    <text x="60" y="66" textAnchor="middle" className="chart-label">TECNO</text>
                  </svg>
                  <div className="insight-legend">
                    {tecnoExperiencePieSlices.map((slice) => (
                      <div key={slice.label} className="legend-row">
                        <span className="dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                        <strong>{slice.percent.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="card insight-card">
              <div className="insight-title">Follows tech content</div>
              {followsTechContentStats.total === 0 ? (
                <div className="hint">No "follows tech content" field detected in current data.</div>
              ) : (
                <div className="insight-chart" role="img" aria-label="Follows tech content pie chart">
                  <svg viewBox="0 0 120 120" className="insight-pie">
                    <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                    {followsTechContentPieSlices.map((slice) => (
                      <path key={slice.label} d={slice.path} fill={slice.color} />
                    ))}
                    <circle cx="60" cy="60" r="30" fill="#fff" />
                    <text x="60" y="66" textAnchor="middle" className="chart-label">FOLLOW</text>
                  </svg>
                  <div className="insight-legend">
                    {followsTechContentPieSlices.map((slice) => (
                      <div key={slice.label} className="legend-row">
                        <span className="dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                        <strong>{slice.percent.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="social-insight-grid">
            <div className="card">
              <div className="coll-header">
                <div className="coll-name">Social media platforms</div>
                <div className="coll-actions">
                  <span className="label">{socialStats.total} selections</span>
                </div>
              </div>
              {socialStats.total === 0 ? (
                <div className="hint">No social platform field detected in current data.</div>
              ) : (
                <div className="social-bars" role="img" aria-label="Social media platforms preference bar chart">
                  {socialStats.rows.map((row, index) => (
                    <div key={row.label || index} className="social-bar">
                      <div className="social-bar-label">{row.label || 'Unspecified'}</div>
                      <div className="social-bar-track" aria-hidden="true">
                        <div
                          className="social-bar-fill"
                          style={{
                            width: `${row.percent.toFixed(1)}%`,
                            background: row.label === 'Snapchat' ? '#000000' : PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                      </div>
                      <div className="social-bar-value">{row.percent.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="card">
              <div className="coll-header">
                <div className="coll-name">Tech update sources</div>
                <div className="coll-actions">
                  <span className="label">{techSourceStats.total} selections</span>
                </div>
              </div>
              {techSourceStats.total === 0 ? (
                <div className="hint">No tech update source field detected in current data.</div>
              ) : (
                <div className="social-bars" role="img" aria-label="Tech update sources bar chart">
                  {techSourceStats.rows.map((row, index) => (
                    <div key={row.label || index} className="social-bar">
                      <div className="social-bar-label">{row.label || 'Unspecified'}</div>
                      <div className="social-bar-track" aria-hidden="true">
                        <div
                          className="social-bar-fill"
                          style={{
                            width: `${row.percent.toFixed(1)}%`,
                            background: PIE_COLORS[(index + 1) % PIE_COLORS.length],
                          }}
                        />
                      </div>
                      <div className="social-bar-value">{row.percent.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div className="coll-header">
                <div className="coll-name">Top phone functions</div>
                <div className="coll-actions">
                  <span className="label">{phoneFunctionStats.total} selections</span>
                </div>
              </div>
              {phoneFunctionStats.total === 0 ? (
                <div className="hint">No "top phone functions" field detected in current data.</div>
              ) : (
                <div className="social-bars" role="img" aria-label="Top phone functions bar chart">
                  {phoneFunctionStats.rows.map((row, index) => (
                    <div key={row.label || index} className="social-bar">
                      <div className="social-bar-label">{row.label || 'Unspecified'}</div>
                      <div className="social-bar-track" aria-hidden="true">
                        <div
                          className="social-bar-fill"
                          style={{
                            width: `${row.percent.toFixed(1)}%`,
                            background: PIE_COLORS[(index + 2) % PIE_COLORS.length],
                          }}
                        />
                      </div>
                      <div className="social-bar-value">{row.percent.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div className="coll-header">
                <div className="coll-name">Time spent on social media</div>
                <div className="coll-actions">
                  <span className="label">{socialTimeStats.total} responses</span>
                </div>
              </div>
              {socialTimeStats.total === 0 ? (
                <div className="hint">No "time spent on social media" field detected in current data.</div>
              ) : (
                <div className="social-time-chart" role="img" aria-label="Time spent on social media pie chart">
                  <svg viewBox="0 0 120 120" className="social-time-pie">
                    <circle cx="60" cy="60" r="50" fill="#eef4ff" />
                    {socialTimePieSlices.map((slice) => (
                      <path key={slice.label} d={slice.path} fill={slice.color} />
                    ))}
                    <circle cx="60" cy="60" r="30" fill="#fff" />
                    <text x="60" y="66" textAnchor="middle" className="chart-label">TIME</text>
                  </svg>
                  <div className="social-time-legend">
                    {socialTimePieSlices.map((slice) => (
                      <div key={slice.label} className="legend-row">
                        <span className="dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                        <strong>{slice.percent.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'surveys' && viewMode === 'table' && (
          <div className="card fade-in">
            {tableCollections.map((c) => {
              const { columns, columnValueMap, visibleDocs } = c;
              return (
                <div key={c.collection} style={{ marginBottom: 16 }}>
                  <div className="coll-header" style={{ marginBottom: 8 }}>
                    <div className="coll-name">{c.collection} ({visibleDocs.length}{!filterDate && typeof c.count === 'number' ? ` / ${c.count}` : ''})</div>
                    <div className="coll-actions">
                      {/* <button className="btn" onClick={handleExportVisible} disabled={!hasExportableData}>
                        Export visible (.xlsx)
                      </button> */}
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {columns.map((col) => {
                            const formattedCol = col
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase())
                              .replace(/_/g, ' ')
                              .trim();
                            const filterKey = getColumnFilterKey(c.collection, col);
                            const selectedValue = columnFilters[filterKey] || '__all__';
                            const availableValues = Array.from(columnValueMap[col] || []);
                            return (
                              <th key={col}>
                                <div className="col-header">
                                  <span>{formattedCol || 'Field'}</span>
                                  <select
                                    value={selectedValue}
                                    onChange={(e) => handleColumnFilterChange(c.collection, col, e.target.value)}
                                  >
                                    <option value="__all__">All answers</option>
                                    {availableValues.map((val) => (
                                      <option key={val} value={val}>
                                        {val}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleDocs.length === 0 ? (
                          <tr>
                            <td colSpan={columns.length || 1} style={{ textAlign: 'center', padding: '24px 0' }}>
                              No responses match the current filters.
                            </td>
                          </tr>
                        ) : (
                          visibleDocs.map((doc, idx) => (
                            <tr key={doc.id || idx}>
                              {columns.length === 0 ? (
                                <td>
                                  <pre>{JSON.stringify(getRowFields(doc), null, 2)}</pre>
                                </td>
                              ) : (
                                columns.map((col) => (
                                  <td key={col}>
                                    {renderCellValue(getRowFields(doc)[col])}
                                  </td>
                                ))
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'surveys' && viewMode === 'cards' && (
          <div className="card fade-in">
            {collections.map((c) => {
              const docs = c.displayDocs || [];
              return (
                <div key={c.collection} style={{ marginBottom: 16 }}>
                  <div className="coll-header" style={{ marginBottom: 8 }}>
                    <div className="coll-name">{c.collection} ({docs.length}{!filterDate && typeof c.count === 'number' ? ` / ${c.count}` : ''})</div>
                    <div className="coll-actions" />
                  </div>
                  <div className="cards-grid">
                    {docs.map((row, idx) => {
                      const entriesRaw = Object.entries(getRowFields(row));
                      const excluded = new Set(['_id','__v','createdAt','updatedAt','timestamps','metadata','ipAddress','userAgent','id','submitted_at']);
                      // Show all fields including null/empty ones, except explicitly hidden ones
                      const entries = entriesRaw
                        .filter(([k]) => {
                          if (excluded.has(k)) return false;
                          return !HIDDEN_FIELD_SET.has(normalizeFieldName(k));
                        });
                      const json = JSON.stringify(row, null, 2);
                      const cardKey = `${c.collection}-${idx}`;
                      const isOpen = !!open[cardKey];
                      const toggleCard = () => setOpen((o) => ({ ...o, [cardKey]: !o[cardKey] }));
                      return (
                        <div key={cardKey} className={`doc-card ${isOpen ? 'open' : ''}`}>
                          <div className="doc-title">
                            <button className="doc-toggle" onClick={toggleCard} aria-expanded={isOpen}>
                              <span>Student {idx + 1}</span>
                              <span className={`chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">▸</span>
                            </button>
                            <div className="coll-actions">
                              <button className="btn" onClick={() => navigator.clipboard.writeText(json)}>Copy</button>
                            </div>
                          </div>
                          {isOpen && (
                            <>
                              <div className="kv">
                                {entries.map(([k, v], i) => {
                                  let value = '';
                                  if (v === null || v === undefined) {
                                    value = '-';
                                  } else if (typeof v === 'string' && v.trim() === '') {
                                    value = '(empty)';
                                  } else if (typeof v === 'object') {
                                    if (Array.isArray(v)) {
                                      if (v.length === 0) {
                                        value = '[]';
                                      } else if (v.length === 1) {
                                        value = String(v[0]);
                                      } else {
                                        value = v.join(', ');
                                      }
                                    } else {
                                      // Handle object fields - check if it's a ranking object
                                      const objKeys = Object.keys(v);
                                      if (objKeys.length > 0) {
                                        // Check if this looks like a ranking object (has numeric values)
                                        const isRanking = objKeys.some(key => !isNaN(v[key]));
                                        if (isRanking) {
                                          // Sort by rank (ascending order)
                                          const sortedEntries = Object.entries(v)
                                            .sort(([,a], [,b]) => {
                                              const numA = parseFloat(a);
                                              const numB = parseFloat(b);
                                              if (isNaN(numA) && isNaN(numB)) return 0;
                                              if (isNaN(numA)) return 1;
                                              if (isNaN(numB)) return -1;
                                              return numA - numB;
                                            });
                                          value = sortedEntries.map(([key, val]) => `${key}: ${val}`).join(', ');
                                        } else {
                                          value = objKeys.map(key => `${key}: ${v[key]}`).join(', ');
                                        }
                                      } else {
                                        value = '{}';
                                      }
                                    }
                                  } else {
                                    value = String(v);
                                  }
                                  return (
                                    <div key={k + '-' + i} style={{ contents: 'unset' }}>
                                      <div className="k">{k}</div>
                                      <div className="v">{value}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
