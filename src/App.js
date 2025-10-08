import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { fetchDashboardData } from './api';

const ADMIN_EMAIL = 'admin@tecnotribe.site';
const ADMIN_PASSWORD = '!password$123*';

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

  useEffect(() => {
    const stored = sessionStorage.getItem('isAuthed');
    if (stored === 'true') setIsAuthed(true);
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    setLoading(true);
    fetchDashboardData()
      .then((json) => setData(json))
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isAuthed]);

  const collections = useMemo(() => {
    if (!data || !data.collections) return [];
    let list = data.collections;
    // Exclude sessions entirely
    list = list.filter((c) => c.collection.toLowerCase() !== 'sessions');
    // Filter by tab
    list = list.filter((c) => {
      const name = c.collection.toLowerCase();
      if (activeTab === 'surveys') return name.includes('survey');
      if (activeTab === 'analytics') return name.includes('analytic');
      return true;
    });
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(c => c.collection.toLowerCase().includes(q));
  }, [data, query, activeTab]);

  const totalDocs = useMemo(() => {
    return collections.reduce((acc, c) => acc + (c.count || (c.docs?.length || 0)), 0);
  }, [collections]);

  function getDocTime(doc) {
    const tryDates = [
      doc?.createdAt,
      doc?.submittedAt,
      doc?.timestamps?.createdAt,
      doc?.metadata?.createdAt,
    ].filter(Boolean);
    if (tryDates.length > 0) {
      const t = Date.parse(tryDates[0]);
      if (!Number.isNaN(t)) return t;
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

  function getFilteredColumns(docs) {
    const excluded = new Set(['_id','__v','createdAt','updatedAt','submittedAt','timestamps','metadata','ip','ipAddress','userAgent']);
    const seen = new Set();
    const ordered = [];
    for (const d of docs) {
      for (const k of Object.keys(d || {})) {
        if (excluded.has(k)) continue;
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
    if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsAuthed(true);
      sessionStorage.setItem('isAuthed', 'true');
    } else {
      setError('Invalid credentials');
    }
  }

  function handleLogout() {
    setIsAuthed(false);
    sessionStorage.removeItem('isAuthed');
    setEmail('');
    setPassword('');
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
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@tecnotribe.site" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="!password$123*" required />
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
            <div className="value" style={{ color: loading ? '#ffda6c' : '#1ad1a5' }}>{loading ? 'Loading…' : 'Connected'}</div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {!loading && collections.length === 0 && (
          <div className="card">No collections found or database is empty.</div>
        )}

        {viewMode === 'cards' && (
          <div className="card fade-in">
            {collections.map((c) => {
              const docs = (c.docs || []).slice().sort((a, b) => getDocTime(a) - getDocTime(b));
              return (
                <div key={c.collection} style={{ marginBottom: 16 }}>
                  <div className="coll-header" style={{ marginBottom: 8 }}>
                    <div className="coll-name">{c.collection} ({c.count})</div>
                    <div className="coll-actions">
                      <button className="btn-secondary btn" onClick={() => navigator.clipboard.writeText(JSON.stringify(docs, null, 2))}>Copy All JSON</button>
                    </div>
                  </div>
                  <div className="cards-grid">
                    {docs.map((row, idx) => {
                      const entriesRaw = Object.entries(row || {});
                      const excluded = new Set(['_id','__v','createdAt','updatedAt','timestamps','metadata','ipAddress','userAgent']);
                      const isEmpty = (val) => {
                        if (val === null || val === undefined) return true;
                        if (typeof val === 'string') return val.trim() === '';
                        if (Array.isArray(val)) return val.length === 0;
                        if (typeof val === 'object') return Object.keys(val).length === 0;
                        return false;
                      };
                      const entries = entriesRaw
                        .filter(([k, v]) => !excluded.has(k) && !isEmpty(v))
                        .sort(([a], [b]) => a.localeCompare(b));
                      const json = JSON.stringify(row, null, 2);
                      const shortId = typeof row._id === 'object' ? (row._id?.$oid || '') : String(row._id || '');
                      return (
                        <div key={c.collection + '-' + idx} className="doc-card">
                          <div className="doc-title">
                            <span>Document {idx + 1}</span>
                            <div className="coll-actions">
                              <button className="btn" onClick={() => navigator.clipboard.writeText(json)}>Copy</button>
                              <button className="btn-secondary btn" onClick={() => setOpen(o => ({ ...o, [c.collection + '-' + idx]: !o[c.collection + '-' + idx] }))}>
                                {open[c.collection + '-' + idx] ? 'Hide JSON' : 'Show JSON'}
                              </button>
                            </div>
                          </div>
                          <div className="kv">
                            {entries.map(([k, v], i) => {
                              const value = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
                              return (
                                <div key={k + '-' + i} style={{ contents: 'unset' }}>
                                  <div className="k">{k}</div>
                                  <div className="v">{value}</div>
                                </div>
                              );
                            })}
                          </div>
                          {open[c.collection + '-' + idx] && (
                            <div style={{ marginTop: 10 }}>
                              <div className="section-title">JSON</div>
                              <pre className="pre">{json}</pre>
                            </div>
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

        {viewMode === 'table' && (
          <div className="card fade-in">
            {collections.map((c) => {
              // infer columns from visible fields
              const docs = (c.docs || []).slice().sort((a, b) => getDocTime(a) - getDocTime(b));
              const columns = getFilteredColumns(docs);
              return (
                <div key={c.collection} style={{ marginBottom: 16 }}>
                  <div className="coll-header" style={{ marginBottom: 8 }}>
                    <div className="coll-name">{c.collection} ({c.count})</div>
                    <div className="coll-actions">
                      <button className="btn-secondary btn" onClick={() => navigator.clipboard.writeText(JSON.stringify(docs, null, 2))}>Copy JSON</button>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {docs.map((row, idx) => (
                          <tr key={idx}>
                            {columns.map((col) => {
                              const val = row[col];
                              const out = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                              return <td key={col + idx}>{out}</td>;
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
