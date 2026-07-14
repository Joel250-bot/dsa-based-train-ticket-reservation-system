/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface AuthContextProps {
  user: any;
  profile: UserProfile;
  loading: boolean;
  logout: () => Promise<void>;
  isAdmin: boolean;
  setRole: (role: 'admin' | 'passenger') => void;
  updateProfile: (name: string, email: string) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setLocalRole] = useState<'admin' | 'passenger'>(() => {
    return (localStorage.getItem('rail_role') as 'admin' | 'passenger') || 'passenger';
  });

  const [passengerName, setPassengerName] = useState(() => {
    return localStorage.getItem('rail_passenger_name') || 'Guest Passenger';
  });

  const [passengerEmail, setPassengerEmail] = useState(() => {
    return localStorage.getItem('rail_passenger_email') || '';
  });

  const [loading, setLoading] = useState(false);

  const setRole = (newRole: 'admin' | 'passenger') => {
    setLocalRole(newRole);
    localStorage.setItem('rail_role', newRole);
  };

  const updateProfile = (name: string, email: string) => {
    setPassengerName(name);
    setPassengerEmail(email);
    localStorage.setItem('rail_passenger_name', name);
    localStorage.setItem('rail_passenger_email', email.toLowerCase().trim());
  };

  const logout = async () => {
    setPassengerName('Guest Passenger');
    setPassengerEmail('');
    setLocalRole('passenger');
    localStorage.removeItem('rail_passenger_name');
    localStorage.removeItem('rail_passenger_email');
    localStorage.setItem('rail_role', 'passenger');
  };

  const dummyUser = {
    uid: role === 'admin' ? 'admin_uid' : 'passenger_uid',
    email: role === 'admin' ? 'admin@railway.gov.in' : passengerEmail,
    displayName: role === 'admin' ? 'System Admin' : passengerName,
  };

  const profile: UserProfile = {
    uid: dummyUser.uid,
    email: dummyUser.email,
    name: dummyUser.displayName,
    role: role,
  };

  const value = {
    user: dummyUser,
    profile,
    loading,
    logout,
    isAdmin: role === 'admin',
    setRole,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
