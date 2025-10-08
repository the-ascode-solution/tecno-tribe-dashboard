export async function fetchDashboardData() {
  // Try via CRA proxy first
  let res = await fetch('/api/data').catch(() => null);
  if (res && res.ok) return res.json();

  // Fallback directly to backend (useful if app started with `npm start` only)
  res = await fetch('http://localhost:5000/api/data').catch((e) => {
    throw new Error(e?.message || 'Network error');
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error(`Failed to fetch data (${res.status}) ${detail}`.trim());
  }
  return res.json();
}


