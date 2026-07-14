/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { PassengerDashboard } from './components/PassengerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Train, Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { profile, loading, isAdmin, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 bg-blue-600/10 rounded-full filter blur-xl animate-pulse"></div>
          <Train className="w-10 h-10 text-blue-500 animate-bounce" />
        </div>
        <p className="text-slate-400 font-mono text-xs mt-4 tracking-wider uppercase flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          Synchronizing Railway Core...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Centralized Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isAdmin ? (
          <AdminDashboard profile={profile} logout={logout} />
        ) : (
          <PassengerDashboard profile={profile} logout={logout} />
        )}
      </main>

      {/* Project Footing Credit */}
      <footer className="py-6 border-t border-slate-900 text-center text-[10px] text-slate-500 font-mono">
        DSA-Based Train Ticket Reservation System — B.Tech CS Core Project Demo
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
