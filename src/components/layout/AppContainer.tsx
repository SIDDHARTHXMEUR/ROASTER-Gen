'use client';

import { useAppStore } from '@/store';
import clsx from 'clsx';

export default function AppContainer({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useAppStore();

  return (
    <div
      className={clsx(
        "min-h-screen transition-all duration-300 ease-in-out",
        isSidebarOpen ? "pl-0 md:pl-72" : "pl-0"
      )}
    >
      <main className="pt-16 min-h-screen pb-20">
        {children}
      </main>
    </div>
  );
}
