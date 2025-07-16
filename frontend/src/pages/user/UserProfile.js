import React, { useState, useEffect, useContext } from 'react';
import { getUserProfile, updateUserProfile } from './api';
import GamifiedProfileCard from './GamifiedProfileCard';
import { AuthContext } from '../../context/AuthContext';

const DEMO_USER_ID = 'demo-user';

const defaultProfile = {
  name: 'Aarti Sharma',
  city: 'Bangalore',
  profilePic: '',
  practiceCount: 0,
  fiveStarCount: 0,
  avgRating: 0,
  lastPractice: '',
  topStrengths: [],
  improvementAreas: [],
  mostPracticedProduct: '',
  streak: 0,
};

export default function UserProfile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { auth, setAuth } = useContext(AuthContext);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        // Get token from context (fallback to localStorage for migration)
        const token = auth?.token || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('auth'))?.token : null);
        console.log("Token:", token);
        if (!token) throw new Error('No auth token found');
        const data = await getUserProfile(token);
        console.log("Profile data:", data);
        setProfile(data);
        setEditName(data.name || '');
        setEditCity(data.city || '');
      } catch (e) {
        setError('Failed to load profile');
      }
      setLoading(false);
    }
    fetchProfile();
  }, [auth]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = auth?.token || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('auth'))?.token : null);
      if (!token) throw new Error('No auth token found');
      const updated = await updateUserProfile(token, { name: editName, city: editCity });
      setProfile(updated);
      setEditing(false);
    } catch (e) {
      setError('Failed to save profile');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
    window.location.href = '/login';
  };

  if (loading) return <div style={{ textAlign: 'center', margin: 40 }}>Loading profile...</div>;

  return (
    <div>
      <button onClick={handleLogout} style={{ float: 'right', margin: '16px', padding: '10px 22px', borderRadius: '8px', background: '#e44210', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Logout</button>
      <GamifiedProfileCard profile={{
        ...profile,
        level: 7, // TODO: use actual level from backend if available
      }} onEdit={() => setEditing(true)} />
    </div>
  );
}
