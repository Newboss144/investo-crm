'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#1F2937',
          border: '1px solid #374151',
          color: '#F9FAFB',
        },
      }}
    />
  );
}
