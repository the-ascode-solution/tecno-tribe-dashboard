import './App.css';
import { useEffect, useMemo, useState, useMemo as useReactMemo } from 'react';
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

        <div className="grid">
          {collections.map((c) => {
            const isOpen = !!open[c.collection];
            const preview = JSON.stringify(c.docs?.[0] ?? {}, null, 2);
            return (
              <div key={c.collection} className="card fade-in">
                <div className="coll-header">
                  <div className="coll-name">{c.collection} ({c.count})</div>
                  <div className="coll-actions">
                    <button className="btn" onClick={() => setOpen(o => ({ ...o, [c.collection]: !isOpen }))}>{isOpen ? 'Collapse' : 'Expand'}</button>
                    <button className="btn-secondary btn" onClick={() => navigator.clipboard.writeText(JSON.stringify(c.docs, null, 2))}>Copy JSON</button>
                  </div>
                </div>
                <div className={`coll-body ${isOpen ? 'open' : ''}`}>
                  <div className="section-title">Documents</div>
                  <pre className="pre">{JSON.stringify(c.docs, null, 2)}</pre>
                </div>
                {!isOpen && (
                  <div style={{ marginTop: 10 }}>
                    <div className="section-title">Preview</div>
                    <pre className="pre">{preview}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
