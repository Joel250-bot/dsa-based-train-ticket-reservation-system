/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { TicketService } from '../services/ticketService';
import { Reservation, UserProfile } from '../types';
import { TicketCard } from './TicketCard';
import { BookingForm } from './BookingForm';
import { TrainStatus } from './TrainStatus';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';
import {
  History,
  LayoutDashboard,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User,
  Activity,
  LogOut
} from 'lucide-react';

interface PassengerDashboardProps {
  profile: UserProfile;
  logout: () => void;
}

export const PassengerDashboard: React.FC<PassengerDashboardProps> = ({ profile, logout }) => {
  const toast = useToast();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [ticketIdToCancel, setTicketIdToCancel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [activeBookings, setActiveBookings] = useState<Reservation[]>([]);
  const [cancelledHistory, setCancelledHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [trainConfig, setTrainConfig] = useState<any>(null);
  const [confirmedReservations, setConfirmedReservations] = useState<Reservation[]>([]);
  const [waitingReservations, setWaitingReservations] = useState<Reservation[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch user bookings
      const { active, cancelled } = await TicketService.getUserBookings(profile.email);
      setActiveBookings(active);
      setCancelledHistory(cancelled);

      // 2. Fetch train & overall seating layout
      const config = await TicketService.getTrainConfig();
      setTrainConfig(config);

      const { linkedList, queue } = await TicketService.reconstructState();
      setConfirmedReservations(linkedList.displayPassengers());
      setWaitingReservations(queue.displayQueue());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.showToast('Failed to sync ticket database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile.email, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCancelTicket = (id: string) => {
    setTicketIdToCancel(id);
    setConfirmModalOpen(true);
  };

  const onConfirmCancel = async () => {
    if (!ticketIdToCancel) return;
    try {
      const { promotedPassenger } = await TicketService.cancelTicket(ticketIdToCancel, profile.name);
      
      toast.showToast('Reservation cancelled successfully.', 'success');
      
      if (promotedPassenger) {
        toast.showToast(
          `Passenger "${promotedPassenger.name}" has been promoted to Confirmed seat ${promotedPassenger.seatNumber}!`,
          'info'
        );
      }
      
      // Refresh
      fetchDashboardData();
    } catch (error: any) {
      toast.showToast(error.message || 'Failed to cancel ticket.', 'error');
    } finally {
      setConfirmModalOpen(false);
      setTicketIdToCancel(null);
    }
  };

  const handleBookingSuccess = () => {
    fetchDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-lg border border-slate-700/50">
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-500 font-mono tracking-widest bg-blue-600/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              Passenger Portal
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Welcome back, {profile.name}!</h2>
            <p className="text-xs text-slate-400">{profile.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/45'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Booking Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              activeTab === 'history'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/45'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Cancellations ({cancelledHistory.length})
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-950 border border-slate-850 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-40 bg-slate-900/60 rounded-2xl animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-slate-900/60 rounded-2xl animate-pulse"></div>
            <div className="h-96 bg-slate-900/60 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      ) : activeTab === 'dashboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form & Seating status */}
          <div className="lg:col-span-4 space-y-6">
            <BookingForm
              onBookingSuccess={handleBookingSuccess}
              userEmail={profile.email}
              userName={profile.name}
            />
            {trainConfig && (
              <TrainStatus
                trainConfig={trainConfig}
                confirmedReservations={confirmedReservations}
                waitingReservations={waitingReservations}
              />
            )}
          </div>

          {/* User Active Tickets */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Active Ticket Reservations ({activeBookings.length})
              </h3>

              {activeBookings.length > 0 ? (
                <div className="space-y-6">
                  {activeBookings.map((res) => (
                    <TicketCard key={res.id} reservation={res} onCancel={handleCancelTicket} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
                  <TicketCard
                    reservation={{
                      id: '',
                      name: 'Sample Ticket Outline',
                      age: 0,
                      gender: 'N/A',
                      phone: '9876543210',
                      email: 'user@example.com',
                      seatNumber: -1,
                      bookingTime: Date.now(),
                      status: 'Waiting',
                      trainNumber: 'EXP101',
                    }}
                  />
                  <p className="text-slate-400 text-sm font-semibold mt-4">No active bookings found.</p>
                  <p className="text-slate-500 text-xs mt-1">Book your ticket using the reservation form on the left.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="glass rounded-2xl p-6 shadow-2xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
            <History className="w-4 h-4 text-red-500" />
            Cancelled Reservations Logs ({cancelledHistory.length})
          </h3>

          {cancelledHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="px-6 py-4">Passenger</th>
                    <th className="px-6 py-4">Age/Gender</th>
                    <th className="px-6 py-4">Seat Log</th>
                    <th className="px-6 py-4">Cancelled By</th>
                    <th className="px-6 py-4">Date Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {cancelledHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-200">{log.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {log.age} / {log.gender}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-red-400 font-mono font-bold bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded-md">
                          Cancelled ({log.seatNumber > 0 ? `Seat ${log.seatNumber}` : 'WL'})
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {log.cancelledBy || 'User'}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {new Date(log.cancelledAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 font-mono text-sm">
              No cancelled ticket logs found in this passenger profile.
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setTicketIdToCancel(null);
        }}
        onConfirm={onConfirmCancel}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this reservation? This action cannot be undone."
      />
    </div>
  );
};
