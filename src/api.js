const ENDPOINTS = [
  '/.netlify/functions/data', // Netlify production + `netlify dev`
  '/api/data',                // CRA proxy (optional)
  'http://localhost:5000/api/data', // Local Express server fallback
];

export async function fetchDashboardData() {
  let lastError = null;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const detail = await safeReadText(res);
        throw new Error(`Failed to fetch data (${res.status}) ${detail}`.trim());
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      // try next endpoint
    }
  }
  throw lastError || new Error('Failed to fetch data');
}

async function safeReadText(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}


