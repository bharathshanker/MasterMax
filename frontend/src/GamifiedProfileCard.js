import React from 'react';

// Utility for XP progress (dummy for now)
function getXPProgress(level) {
  // Example: each level needs 100 XP, level 7 = 600/700 XP
  const xp = (level - 1) * 100 + 70; // fake value for demo
  const max = level * 100;
  return { xp, max };
}

export default function GamifiedProfileCard({ profile, onEdit }) {
  const { xp, max } = getXPProgress(profile.level || 7);
  return (
    <div style={{
      background: '#2c1850',
      borderRadius: 28,
      color: '#fff',
      boxShadow: '0 6px 36px #0003',
      padding: 32,
      maxWidth: 420,
      margin: '40px auto',
      fontFamily: 'inherit',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Shield + Edit */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ background: '#e44210', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 800, border: '4px solid #fff5' }}>
            B
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>{profile.name || 'User'}</div>
            <div style={{ fontSize: 17, color: '#ffc107', fontWeight: 500 }}>Level {profile.level || 7}</div>
          </div>
        </div>
        <button onClick={onEdit} style={{ background: '#3578e6', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, padding: '7px 22px', cursor: 'pointer', boxShadow: '0 1px 4px #3578e620' }}>EDIT</button>
      </div>
      {/* XP Bar */}
      <div style={{ margin: '8px 0 18px 0', width: '100%' }}>
        <div style={{ fontSize: 15, color: '#fff8', marginBottom: 2 }}>XP</div>
        <div style={{ background: '#fff3', borderRadius: 9, height: 14, width: '100%', position: 'relative', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #ffd700 70%, #e44210)', width: `${(xp / max) * 100}%`, height: 14, borderRadius: 9, transition: 'width 0.5s' }} />
        </div>
      </div>
      {/* Stats Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '18px 0 8px 0', gap: 8 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#36d1c4' }}>{profile.practiceCount ?? 0}</div>
          <div style={{ fontSize: 15, color: '#fff8', fontWeight: 500 }}>PRACTICE PITCHES</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ffb300' }}>{profile.fiveStarCount ?? 0}</div>
          <div style={{ fontSize: 15, color: '#fff8', fontWeight: 500 }}>5-STAR RATINGS</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{profile.avgRating?.toFixed(2) ?? '0.00'}</div>
          <div style={{ fontSize: 15, color: '#fff8', fontWeight: 500 }}>AVG RATING</div>
        </div>
      </div>
      {/* Meta Info */}
      <div style={{ margin: '16px 0 0 0', fontSize: 15 }}>
        <div style={{ marginBottom: 2 }}><span style={{ color: '#fff8' }}>Last Practice:</span> <span>{profile.lastPractice ? new Date(profile.lastPractice).toISOString().slice(0, 10) : 'N/A'}</span></div>
        <div style={{ marginBottom: 2 }}><span style={{ color: '#fff8' }}>Most Practiced Product:</span> <span>{profile.mostPracticedProduct || 'N/A'}</span></div>
        <div style={{ marginBottom: 2 }}><span style={{ color: '#fff8' }}>Consistency Streak:</span> <span>{profile.streak ?? 0} days</span></div>
      </div>
      {/* Strengths & Improvements */}
      <div style={{ display: 'flex', marginTop: 18, gap: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#4caf50', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>STRENGTHS</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', color: '#b2ff59', fontSize: 16 }}>
            {profile.topStrengths?.length ? profile.topStrengths.map((s, i) => <li key={i} style={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}><span role="img" aria-label="leaf" style={{ fontSize: 20, marginRight: 7 }}>🌱</span> {s}</li>) : <li>No data yet</li>}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#ff7043', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>IMPROVEMENT AREAS</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', color: '#ffab91', fontSize: 16 }}>
            {profile.improvementAreas?.length ? profile.improvementAreas.map((s, i) => <li key={i} style={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}><span role="img" aria-label="quest" style={{ fontSize: 20, marginRight: 7 }}>🧩</span> {s}</li>) : <li>No data yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
