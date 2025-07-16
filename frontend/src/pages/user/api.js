// API helper for user profile

// Make sure you have a .env file at the root of your project with:
// REACT_APP_API_BASE=<your_api_base_url>

const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function getUserProfile(token) {
  const res = await fetch(`${API_BASE}/api/user-profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function updateUserProfile(token, updates) {
  const res = await fetch(`${API_BASE}/api/user-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update user profile');
  return res.json();
}
