import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { fetchDashboardData } from './api';

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

const ADMIN_USERS = [
  { email: 'admin@tecnotribe.site', password: '!password$123*' },
  { email: 'hussainfarhad509@gmail.com', password: 'Mfarhad@0222_0111' },
  { email: 'dev@tecnotribe.site', password: 'password123' },
];

const DATE_FIELD_NAMES = [
  'createdAt','created_at',
  'updatedAt','updated_at',
  'submittedAt','submitted_at',
  'timestamp','Timestamp',
  'submissionDate','submission_date',
  'date','Date',
  'time','Time',
];

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

function normalizeFieldName(value) {
  return (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
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

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState({});
  const [activeTab, setActiveTab] = useState('surveys'); // 'surveys' | 'analytics'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showPassword, setShowPassword] = useState(false);
  const [sortOption, setSortOption] = useState('name-asc');
  const [filterDate, setFilterDate] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('isAuthed');
    if (stored === 'true') setIsAuthed(true);
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    setLoading(true);
    setError('');
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
      .finally(() => setLoading(false));
  }, [isAuthed]);

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

  const sortSelectValue = filterDate ? `date:${filterDate}` : sortOption;

  function getRowFields(doc) {
    if (!doc || typeof doc !== 'object') return {};
    if (doc.data && typeof doc.data === 'object') {
      return doc.data;
    }
    return doc;
  }

  function getFilteredColumns(docs) {
    const excluded = new Set(['_id','__v','createdAt','updatedAt','submittedAt','timestamps','metadata','ip','ipAddress','userAgent','id','submitted_at']);
    const seen = new Set();
    const ordered = [];
    for (const d of docs) {
      const fields = getRowFields(d);
      for (const k of Object.keys(fields)) {
        if (excluded.has(k)) continue;
        if (HIDDEN_FIELD_SET.has(normalizeFieldName(k))) continue;
        if (!seen.has(k)) {
          seen.add(k);
          ordered.push(k);
        }
      }
    }
    return ordered; // preserve first-seen order from DB
  }

  function handleLogin(e) {
    e.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    const isValid = ADMIN_USERS.some((user) => user.email.toLowerCase() === normalizedEmail && user.password === password);
    if (isValid) {
      setIsAuthed(true);
      sessionStorage.setItem('isAuthed', 'true');
    } else {
      setError('Invalid credentials');
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

  if (!isAuthed) {
    return (
      <div className="centered">
        <div className="card auth-card fade-in">
          <div className="brand" style={{ marginBottom: 8 }}>
            <div className="brand-badge" /> TecnoTribe
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
              <button type="submit" className="btn">Sign In</button>
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
          <div className="brand"><div className="brand-badge" /> TecnoTribe Dashboard</div>
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
          <div className="card fade-in" style={{ marginBottom: 16 }}>
            <div className="coll-header" style={{ marginBottom: 8 }}>
              <div className="coll-name">Daily form submissions</div>
              <div className="coll-actions">
                <span className="label">Tracking {dailyCounts.length} day{dailyCounts.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Forms submitted</th>
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
        )}

        {activeTab === 'surveys' && viewMode === 'cards' && (
          <div className="card fade-in">
            {collections.map((c) => {
              const docs = c.displayDocs || [];
              return (
                <div key={c.collection} style={{ marginBottom: 16 }}>
                  <div className="coll-header" style={{ marginBottom: 8 }}>
                    <div className="coll-name">{c.collection} ({docs.length}{!filterDate && typeof c.count === 'number' ? ` / ${c.count}` : ''})</div>
                    <div className="coll-actions">
                      <button className="btn-secondary btn" onClick={() => navigator.clipboard.writeText(JSON.stringify(docs, null, 2))}>Copy All JSON</button>
                    </div>
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

        {activeTab === 'surveys' && viewMode === 'table' && (
          <div className="card fade-in">
            {collections.map((c) => {
              // infer columns from visible fields
              const docs = c.displayDocs || [];
              const columns = getFilteredColumns(docs);
              return (
                <div key={c.collection} style={{ marginBottom: 16 }}>
                  <div className="coll-header" style={{ marginBottom: 8 }}>
                    <div className="coll-name">{c.collection} ({docs.length}{!filterDate && typeof c.count === 'number' ? ` / ${c.count}` : ''})</div>
                    <div className="coll-actions">
                      <button className="btn-secondary btn" onClick={() => navigator.clipboard.writeText(JSON.stringify(docs, null, 2))}>Copy JSON</button>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {columns.map((col) => {
                            // Format column names to be more readable
                            const formattedCol = col
                              .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                              .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                              .replace(/_/g, ' ') // Replace underscores with spaces
                              .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize each word
                              .trim();
                            return <th key={col}>{formattedCol}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {docs.map((row, idx) => (
                          <tr key={idx}>
                            {columns.map((col) => {
                              const fields = getRowFields(row);
                              const val = fields[col];
                              let out = '';
                              
                              if (val === null || val === undefined) {
                                out = '-';
                              } else if (typeof val === 'string' && val.trim() === '') {
                                out = '(empty)';
                              } else if (typeof val === 'object') {
                                if (Array.isArray(val)) {
                                  if (val.length === 0) {
                                    out = '[]';
                                  } else if (val.length === 1) {
                                    out = String(val[0]);
                                  } else {
                                    out = val.join(', ');
                                  }
                                } else {
                                  // Handle object fields - check if it's a ranking object
                                  const objKeys = Object.keys(val);
                                  if (objKeys.length > 0) {
                                    // Check if this looks like a ranking object (has numeric values)
                                    const isRanking = objKeys.some(key => !isNaN(val[key]));
                                    if (isRanking) {
                                      // Sort by rank (ascending order)
                                      const sortedEntries = Object.entries(val)
                                        .sort(([,a], [,b]) => {
                                          const numA = parseFloat(a);
                                          const numB = parseFloat(b);
                                          if (isNaN(numA) && isNaN(numB)) return 0;
                                          if (isNaN(numA)) return 1;
                                          if (isNaN(numB)) return -1;
                                          return numA - numB;
                                        });
                                      out = sortedEntries.map(([key, value]) => `${key}: ${value}`).join(', ');
                                    } else {
                                      out = objKeys.map(key => `${key}: ${val[key]}`).join(', ');
                                    }
                                  } else {
                                    out = '{}';
                                  }
                                }
                              } else if (typeof val === 'boolean') {
                                out = val ? 'Yes' : 'No';
                              } else if (typeof val === 'string' && val.length > 50) {
                                out = val.substring(0, 47) + '...';
                              } else {
                                out = String(val);
                              }
                              
                              return <td key={col + idx} title={typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}>{out}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
