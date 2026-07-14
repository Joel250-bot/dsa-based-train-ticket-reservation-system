/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Train, LogOut, ShieldAlert, Award, Edit3, Check, X, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { profile, logout, isAdmin, setRole, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || '');
  const [tempEmail, setTempEmail] = useState(profile?.email || '');

  if (!profile) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim() || !tempEmail.trim()) return;
    updateProfile(tempName.trim(), tempEmail.trim());
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setTempName(profile.name);
    setTempEmail(profile.email);
    setIsEditing(true);
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md">
              <Train className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight text-white flex items-center gap-1">
                RAIL<span className="text-blue-500 font-normal">CORE</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold font-mono">
                DSA Reservation System
              </p>
            </div>
          </div>

          {/* Center Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1">
            <button
              onClick={() => setRole('passenger')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                !isAdmin
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/45'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3 h-3" />
              Passenger
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                isAdmin
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/45'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              Admin
            </button>
          </div>

          {/* Right Side Info */}
          <div className="flex items-center gap-4">
            {/* User Info with edit options */}
            <div className="hidden sm:flex items-center gap-2">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 animate-fade-in">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Name"
                    className="bg-slate-900 text-xs px-2 py-1 rounded-lg outline-none border border-slate-800 focus:border-blue-500 text-white max-w-[100px]"
                    required
                  />
                  <input
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    placeholder="Email"
                    className="bg-slate-900 text-xs px-2 py-1 rounded-lg outline-none border border-slate-800 focus:border-blue-500 text-white max-w-[140px]"
                    required
                  />
                  <button type="submit" className="p-1 hover:bg-green-950/50 text-green-400 rounded transition-colors cursor-pointer" title="Save Profile">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="p-1 hover:bg-red-950/50 text-red-400 rounded transition-colors cursor-pointer" title="Cancel">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1 justify-end">
                      {profile.name}
                      {!isAdmin && (
                        <button
                          onClick={handleStartEditing}
                          className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer"
                          title="Edit Simulated Passenger Profile"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{profile.email}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Role Badge */}
            {isAdmin ? (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-500 font-mono bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <ShieldAlert className="w-3 h-3" />
                ADMIN
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 font-mono bg-blue-600/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                <Award className="w-3 h-3" />
                PASSENGER
              </span>
            )}

            {/* Reset Profile Button */}
            <button
              onClick={logout}
              className="flex items-center justify-center p-2 bg-slate-950 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              title="Reset Profile to Guest"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Profile Editor Toggle */}
        {!isAdmin && !isEditing && (
          <div className="sm:hidden pb-2 flex justify-end">
            <button
              onClick={handleStartEditing}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit Simulated Passenger: {profile.name}
            </button>
          </div>
        )}
        {isEditing && (
          <div className="sm:hidden pb-3 border-t border-slate-800 pt-2">
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Simulated Name"
                className="bg-slate-950 text-xs px-3 py-1.5 rounded-xl border border-slate-850 focus:border-blue-500 text-white w-full"
                required
              />
              <input
                type="email"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                placeholder="Simulated Email"
                className="bg-slate-950 text-xs px-3 py-1.5 rounded-xl border border-slate-850 focus:border-blue-500 text-white w-full"
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
};
