'use client';

import { useEffect } from 'react';

export default function PCPage() {
  useEffect(() => {
    // Redirect to main page for now
    window.location.href = '/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to main page...</p>
    </div>
  );
}