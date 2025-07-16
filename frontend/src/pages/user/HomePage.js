import React from 'react';
import UserProfile from './UserProfile';

function HomePage() {
  return (
    <div style={{ padding: '20px' }}>
      {/* UserProfile component will fetch its own data and render here */}
      {/* It internally might use GamifiedProfileCard */}
      <UserProfile />
    </div>
  );
}

export default HomePage;
