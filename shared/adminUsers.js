function normalizeEmail(value) {
  return (value ?? '')
    .toString()
    .trim()
    .toLowerCase();
}

function sanitizeUsers(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => entry && typeof entry.email === 'string' && typeof entry.password === 'string')
      .map((entry) => ({
        email: normalizeEmail(entry.email),
        password: String(entry.password),
      }));
  } catch (error) {
    console.warn('Invalid ADMIN_USERS_JSON value. Expected JSON array of { email, password } objects.', error);
    return [];
  }
}

function getAdminUsers() {
  const raw =
    process.env.ADMIN_USERS_JSON ||
    process.env.REACT_APP_ADMIN_USERS ||
    process.env.ADMIN_USERS ||
    '';

  const parsed = sanitizeUsers(raw);
  if (parsed.length) {
    return parsed;
  }

  const fallbackEmail = process.env.ADMIN_EMAIL;
  const fallbackPassword = process.env.ADMIN_PASSWORD;
  if (fallbackEmail && fallbackPassword) {
    return [{ email: normalizeEmail(fallbackEmail), password: String(fallbackPassword) }];
  }

  return [];
}

function verifyAdminCredentials({ email, password }) {
  if (!email || !password) {
    return { ok: false, error: 'Email and password are required' };
  }

  const users = getAdminUsers();
  if (!users.length) {
    return { ok: false, error: 'Admin access not configured. Contact support.' };
  }

  const normalizedEmail = normalizeEmail(email);
  const match = users.find((user) => user.email === normalizedEmail && user.password === String(password));

  if (!match) {
    return { ok: false, error: 'Invalid credentials' };
  }

  return { ok: true };
}

module.exports = {
  getAdminUsers,
  verifyAdminCredentials,
};
