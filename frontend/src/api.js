// API helper for user profile

const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function getUserProfile() {
  const res = await fetch(`${API_BASE}/api/user-profile`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function updateUserProfile(updates) {
  const res = await fetch(`${API_BASE}/api/user-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update user profile');
  return res.json();
}
