'use client';

import { useAppStore, Role } from '@/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Menu,
  X,
  User,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarDays,
  Wallet,
  LayoutGrid,
  Users,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import clsx from 'clsx';

const roles: Role[] = ['Supervisor', 'Evaluator'];

const navLinks = [
  { label: 'Weekly Roster', href: '/', icon: CalendarDays, accent: 'text-blue-500' },
  { label: 'Budget & Overtime', href: '/budget', icon: Wallet, accent: 'text-amber-500' },
  { label: 'Station Matching', href: '/stations', icon: LayoutGrid, accent: 'text-violet-500' },
  { label: 'Personnel Directory', href: '/search', icon: Users, accent: 'text-emerald-500' },
  { label: 'Demand Forecast', href: '/forecast', icon: BarChart3, accent: 'text-rose-500' },
];

export default function Navbar() {
  const { role, setRole, isEvaluatorDrawerOpen, setEvaluatorDrawerOpen, isSidebarOpen, toggleSidebar, toast, clearToast } = useAppStore();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('08:42:19');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Sliding Enterprise Sidebar (Desktop) */}
      <motion.aside
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : -288 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-200/80 z-50 flex-col justify-between select-none shadow-md"
      >
        <div className="flex flex-col">
          {/* Brand Plate */}
          <div className="h-16 px-6 border-b border-slate-200/80 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg brand-gradient-animate flex items-center justify-center text-white font-bold text-sm shadow-sm">
                R
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-slate-900 font-sans block leading-none">
                  RosterGen
                </span>
                <span className="text-[11px] font-medium text-slate-500 font-sans block mt-0.5">
                  Enterprise Scheduler
                </span>
              </div>
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Slide Sidebar Close"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Corporate Context Card */}
          <div className="p-4 mx-3 my-3 rounded-lg border border-slate-200/80 bg-slate-50/70">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Operational Hub</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xs font-semibold text-slate-800 mt-1">
              Cloud &amp; Risk Operations
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Delhi HQ · Q2 Planning
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-5 py-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Navigation
          </div>

          <nav className="flex flex-col px-3 space-y-0.5">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "px-3.5 py-2.5 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-all",
                    isActive
                      ? "nav-link-active text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={clsx(
                    "w-3.5 h-3.5 shrink-0 transition-colors",
                    isActive ? "text-blue-300" : item.accent
                  )} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Clean Status Footer */}
        <div className="border-t border-slate-200/80 p-4 mx-2 mb-2 bg-slate-50/80 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-2">
            <span>Roster Allocation</span>
            <span className="font-semibold text-slate-900">98.4%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: '98.4%' }}></div>
          </div>
        </div>
      </motion.aside>

      {/* Clean System Top Header Bar */}
      <header className={clsx(
        "fixed top-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 z-40 px-6 flex items-center justify-between transition-all duration-300 ease-in-out",
        isSidebarOpen ? "left-0 md:left-72" : "left-0"
      )}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-700"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Desktop Sliding Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs items-center gap-2 text-xs font-semibold"
            title={isSidebarOpen ? "Slide Sidebar Out" : "Slide Sidebar In"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-slate-600" />
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-slate-800 font-sans">Menu</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-xs font-semibold text-slate-900 font-sans">
              Enterprise Operations
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">UTC {utcTime}</span>
              <span className="text-slate-300">·</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Evaluator Mode Drawer Trigger */}
          <button
            onClick={() => setEvaluatorDrawerOpen(!isEvaluatorDrawerOpen)}
            className={clsx(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer shadow-xs",
              isEvaluatorDrawerOpen
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
            title="Open Algorithm Evaluator Drawer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Algorithm Evaluator</span>
          </button>

          {/* Role Selector Pill */}
          <div className="flex items-center border border-slate-200 bg-slate-50/80 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-[11px] font-medium text-slate-500 mr-2">Role:</span>
            <select
              aria-label="Role Selector"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer border-none focus:ring-0 p-0"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar Icon */}
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold shadow-xs">
            <User className="w-4 h-4 text-slate-200" />
          </div>
        </div>
      </header>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-6 z-50 max-w-md shadow-lg border rounded-xl overflow-hidden bg-white text-xs font-sans select-none border-slate-200/80"
          >
            <div className="flex items-start gap-3 p-4">
              <div className={clsx(
                "p-2 rounded-lg text-white shrink-0 shadow-xs mt-0.5",
                toast.type === 'alert' ? "bg-rose-600" : toast.type === 'success' ? "bg-emerald-600" : "bg-blue-600"
              )}>
                {toast.type === 'alert' ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Info className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0 font-medium text-slate-800 leading-snug">
                {toast.message}
              </div>
              <button
                onClick={clearToast}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-md hover:bg-slate-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Auto-dismiss progress bar */}
            <div className="px-4 pb-3">
              <div className={clsx(
                "toast-progress opacity-30",
                toast.type === 'alert' ? "text-rose-600" : toast.type === 'success' ? "text-emerald-600" : "text-blue-600"
              )} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-72 h-full bg-white border-r border-slate-200 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                      R
                    </div>
                    <span className="font-bold text-sm text-slate-900">RosterGen</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex flex-col p-3 gap-1">
                  {navLinks.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={clsx(
                          "px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                          isActive
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50">
                <div className="text-[11px] text-slate-400 font-medium mb-0.5">
                  Delhi Operations Hub
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Sprint 18 Active
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
