'use client';

import { Sidebar } from '@/components/sidebar';
import { Dashboard } from '@/components/dashboard';
import { usePathname } from 'next/navigation';

export default function Home() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <Sidebar currentPath={pathname} />
      <main className="flex-1 overflow-y-auto p-8">
        <Dashboard />
      </main>
    </div>
  );
}
