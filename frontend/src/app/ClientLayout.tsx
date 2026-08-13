'use client';

import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-family)',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#FF385C', secondary: 'white' },
          },
          duration: 3000,
        }}
      />
      <Suspense fallback={null}>{children}</Suspense>
    </AuthProvider>
  );
}
