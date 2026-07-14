/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { TicketService } from '../services/ticketService';
import { Reservation, TrainConfig, UserProfile } from '../types';
import { TrainStatus } from './TrainStatus';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';
import {
  Settings,
  Users,
  Layers,
  Trash2,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart2,
  LogOut,
  RefreshCw,
  Sliders,
  GitCommit,
  ArrowRight,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

interface AdminDashboardProps {
  profile: UserProfile;
  logout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ profile, logout }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [trainConfig, setTrainConfig] = useState<TrainConfig | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [ticketIdToCancel, setTicketIdToCancel] = useState<string | null>(null);
  const [passengerNameToCancel, setPassengerNameToCancel] = useState<string>('');
  
  // Data Structure lists
  const [confirmedReservations, setConfirmedReservations] = useState<Reservation[]>([]);
  const [waitingReservations, setWaitingReservations] = useState<Reservation[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);

  // Search, Pagination & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'confirmed' | 'waiting' | 'cancellations' | 'config'>('overview');
  const [confirmedPage, setConfirmedPage] = useState(1);
  const itemsPerPage = 8;

  // Form states for config
  const [seatsInput, setSeatsInput] = useState('20');
  const [waitingInput, setWaitingInput] = useState('10');
  const [updatingConfig, setUpdatingConfig] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const config = await TicketService.getTrainConfig();
      setTrainConfig(config);
      setSeatsInput(config.totalSeats.toString());
      setWaitingInput(config.waitingCapacity.toString());

      const { linkedList, queue } = await TicketService.reconstructState();
      setConfirmedReservations(linkedList.displayPassengers());
      setWaitingReservations(queue.displayQueue());

      const cancelsList = await TicketService.getAllCancellations();
      setCancellations(cancelsList);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      toast.showToast('Failed to retrieve server data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleCancelTicket = (id: string, name: string) => {
    setTicketIdToCancel(id);
    setPassengerNameToCancel(name);
    setConfirmModalOpen(true);
  };

  const onConfirmCancel = async () => {
    if (!ticketIdToCancel) return;
    try {
      const { promotedPassenger } = await TicketService.cancelTicket(ticketIdToCancel, 'Admin');
      toast.showToast(`Ticket of "${passengerNameToCancel}" cancelled successfully.`, 'success');
      
      if (promotedPassenger) {
        toast.showToast(
          `Passenger "${promotedPassenger.name}" automatically promoted from Queue to Seat ${promotedPassenger.seatNumber}!`,
          'info'
        );
      }
      fetchAdminData();
    } catch (error: any) {
      toast.showToast(error.message || 'Failed to cancel ticket.', 'error');
    } finally {
      setConfirmModalOpen(false);
      setTicketIdToCancel(null);
      setPassengerNameToCancel('');
    }
  };

  // State and handlers for deleting cancellation logs
  const [confirmDeleteLogOpen, setConfirmDeleteLogOpen] = useState(false);
  const [logIdToDelete, setLogIdToDelete] = useState<string | null>(null);
  const [logNameToDelete, setLogNameToDelete] = useState<string>('');
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);

  const handleDeleteLog = (id: string, name: string) => {
    setLogIdToDelete(id);
    setLogNameToDelete(name);
    setConfirmDeleteLogOpen(true);
  };

  const onConfirmDeleteLog = async () => {
    if (!logIdToDelete) return;
    try {
      await TicketService.deleteCancellation(logIdToDelete);
      toast.showToast(`Cancellation log for "${logNameToDelete}" deleted successfully.`, 'success');
      fetchAdminData();
    } catch (error: any) {
      toast.showToast(error.message || 'Failed to delete cancellation log.', 'error');
    } finally {
      setConfirmDeleteLogOpen(false);
      setLogIdToDelete(null);
      setLogNameToDelete('');
    }
  };

  const handleClearAllLogs = () => {
    setConfirmClearAllOpen(true);
  };

  const onConfirmClearAll = async () => {
    try {
      await TicketService.clearAllCancellations();
      toast.showToast('All cancellation logs cleared successfully.', 'success');
      fetchAdminData();
    } catch (error: any) {
      toast.showToast(error.message || 'Failed to clear cancellation logs.', 'error');
    } finally {
      setConfirmClearAllOpen(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeats = Number(seatsInput);
    const waitingCapacity = Number(waitingInput);

    if (isNaN(totalSeats) || totalSeats < 1 || totalSeats > 100) {
      toast.showToast('Total seats must be between 1 and 100', 'error');
      return;
    }
    if (isNaN(waitingCapacity) || waitingCapacity < 0 || waitingCapacity > 50) {
      toast.showToast('Waiting capacity must be between 0 and 50', 'error');
      return;
    }

    setUpdatingConfig(true);
    try {
      await TicketService.updateTrainConfig({
        name: trainConfig?.name || 'Express 101',
        number: trainConfig?.number || 'EXP101',
        source: trainConfig?.source || 'Delhi (NDLS)',
        destination: trainConfig?.destination || 'Mumbai (CSMT)',
        totalSeats,
        waitingCapacity,
      });

      toast.showToast('Train parameters updated successfully.', 'success');
      fetchAdminData();
    } catch (error: any) {
      toast.showToast(error.message || 'Failed to update config.', 'error');
    } finally {
      setUpdatingConfig(false);
    }
  };

  // Filter confirmed list by search query
  const filteredConfirmed = confirmedReservations.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      r.phone.includes(query) ||
      r.id.includes(query)
    );
  });

  // Paginated confirmed records
  const totalConfirmedPages = Math.ceil(filteredConfirmed.length / itemsPerPage) || 1;
  const paginatedConfirmed = filteredConfirmed.slice(
    (confirmedPage - 1) * itemsPerPage,
    confirmedPage * itemsPerPage
  );

  // CSV Export
  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Name', 'Age', 'Gender', 'Phone', 'Email', 'Seat Number', 'Booking Time', 'Status'];
      const rows = confirmedReservations.concat(waitingReservations).map((r) => [
        r.id,
        r.name,
        r.age,
        r.gender,
        r.phone,
        r.email,
        r.seatNumber > 0 ? r.seatNumber : 'WL',
        new Date(r.bookingTime).toISOString(),
        r.status,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `EXP101_Manifest_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.showToast('Reservation list exported successfully.', 'success');
    } catch (error) {
      toast.showToast('Failed to compile data export.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Header */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-500 font-mono tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            System Administrator
          </span>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            Central Railway Control Dashboard
            <RefreshCw
              onClick={fetchAdminData}
              className={`w-4 h-4 text-slate-400 hover:text-white transition-colors cursor-pointer ${
                loading ? 'animate-spin text-blue-500' : ''
              }`}
              title="Sync Databases"
            />
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Logged in as {profile.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'overview'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/45'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'confirmed'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/45'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            SLL Confirmed ({confirmedReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('waiting')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'waiting'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/45'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            FIFO Queue ({waitingReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('cancellations')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'cancellations'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/45'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
            }`}
          >
            Cancellations ({cancellations.length})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className="flex-1 md:flex-initial p-2.5 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title="System Parameters"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="p-2.5 bg-slate-950 border border-slate-850 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-900/60 rounded-xl animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-900/60 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* Main Content Area */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Top Analytical Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-xl shadow-md">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold font-mono uppercase tracking-wider">
                    <span>Confirmed Passengers</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-white mt-2 font-mono">
                    {confirmedReservations.length}
                  </p>
                  <p className="text-[10px] text-emerald-500 mt-1 font-mono font-bold uppercase tracking-wider">
                    {trainConfig ? trainConfig.totalSeats - confirmedReservations.length : 0} vacant berths
                  </p>
                </div>

                <div className="glass p-5 rounded-xl shadow-md">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold font-mono uppercase tracking-wider">
                    <span>Queue Size</span>
                    <Layers className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-3xl font-bold text-amber-500 mt-2 font-mono">
                    {waitingReservations.length}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono font-bold uppercase tracking-wider">
                    Capacity: {trainConfig?.waitingCapacity} passengers
                  </p>
                </div>

                <div className="glass p-5 rounded-xl shadow-md">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold font-mono uppercase tracking-wider">
                    <span>Coach Capacity</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold text-white mt-2 font-mono">
                    {Math.round(
                      (confirmedReservations.length / (trainConfig?.totalSeats || 1)) * 100
                    )}
                    %
                  </p>
                  <p className="text-[10px] text-emerald-500 mt-1 font-mono font-bold uppercase tracking-wider">Berth Occupancy Rate</p>
                </div>

                <div className="glass p-5 rounded-xl shadow-md">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold font-mono uppercase tracking-wider">
                    <span>Cancellations Record</span>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-red-500 mt-2 font-mono">
                    {cancellations.length}
                  </p>
                  <p className="text-[10px] text-red-500 mt-1 font-mono font-bold uppercase tracking-wider">System-wide cancellations</p>
                </div>
              </div>

              {/* Seating Layout & Export bar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  {trainConfig && (
                    <TrainStatus
                      trainConfig={trainConfig}
                      confirmedReservations={confirmedReservations}
                      waitingReservations={waitingReservations}
                    />
                  )}
                </div>

                {/* System Controls & Export manifest */}
                <div className="lg:col-span-4 glass rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                      Operational Services
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This administrative portal connects local in-memory Linked List and Queue models with Google Firestore collections in real-time. Changes instantly broadcast to passenger portals.
                    </p>

                    <div className="space-y-2.5 pt-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Database Status</span>
                        <span className="text-emerald-500 font-bold font-mono">● ONLINE SYNC</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>SLL Confirmed Pointer</span>
                        <span className="text-blue-500 font-mono font-bold uppercase tracking-wider">
                          Head ➔ {confirmedReservations.length > 0 ? 'PassengerNode' : 'Null'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>FIFO Queue Waitlist</span>
                        <span className="text-amber-500 font-mono font-bold uppercase tracking-wider">
                          Front ➔ {waitingReservations.length > 0 ? 'QueueNode' : 'Null'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                    <button
                      onClick={exportToCSV}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-950 hover:bg-slate-900 text-blue-500 font-bold border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export Booking Manifest (CSV)
                    </button>
                    <button
                      onClick={() => setActiveTab('config')}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                      Adjust System Capacities
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'confirmed' && (
            <div className="glass rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-blue-500 rotate-90" />
                    Singly Linked List (SLL) - Confirmed Passengers
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Demonstrates insertion, deletion and sequential search over the Node list chain.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search node..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none placeholder-slate-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* SLL Pointer Visualizer Block */}
              {confirmedReservations.length > 0 && (
                <div className="glass p-4 rounded-xl overflow-x-auto space-y-2">
                  <p className="text-[10px] text-blue-500 font-bold font-mono uppercase tracking-widest">
                    SLL Sequential Pointer Visualization
                  </p>
                  <div className="flex items-center gap-2 min-w-max pb-2 pt-1">
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded">
                      Head (Ptr)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

                    {confirmedReservations.slice(0, 5).map((res, index) => (
                      <React.Fragment key={res.id}>
                        <div className="flex flex-col bg-slate-900/40 border border-slate-700/50 p-3 rounded-xl text-[10px] font-mono shadow-inner max-w-[140px] node-link">
                          <span className="text-slate-200 font-bold truncate max-w-[120px]">
                            {res.name}
                          </span>
                          <span className="text-blue-500 text-[9px] mt-0.5">Seat: {res.seatNumber}</span>
                          <span className="text-slate-500 text-[8px] mt-1 border-t border-slate-800/40 pt-1 truncate">
                            Next: {index === confirmedReservations.length - 1 ? 'Null' : '➔ Ptr'}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 animate-pulse" />
                      </React.Fragment>
                    ))}

                    {confirmedReservations.length > 5 && (
                      <>
                        <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-xl text-[10px] text-slate-500 font-mono">
                          ... +{confirmedReservations.length - 5} more nodes
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      </>
                    )}

                    <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-900/40 text-slate-500 border border-slate-800 rounded">
                      Null
                    </span>
                  </div>
                </div>
              )}

              {/* Passenger manifest table */}
              {paginatedConfirmed.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                      <tr>
                        <th className="px-5 py-3">Berth #</th>
                        <th className="px-5 py-3">Passenger Node Details</th>
                        <th className="px-5 py-3">Phone / Contact</th>
                        <th className="px-5 py-3">Time Registered</th>
                        <th className="px-5 py-3 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {paginatedConfirmed.map((res) => (
                        <tr key={res.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="px-5 py-3 font-mono text-sm font-bold text-blue-500">
                            #{res.seatNumber}
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-slate-200">{res.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {res.age} yrs | {res.gender} | ID: {res.id}
                            </div>
                          </td>
                          <td className="px-5 py-3 font-mono">
                            <div className="text-slate-300">{res.phone}</div>
                            <div className="text-[10px] text-slate-500">{res.email}</div>
                          </td>
                          <td className="px-5 py-3 text-slate-400 font-mono">
                            {new Date(res.bookingTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleCancelTicket(res.id, res.name)}
                              className="text-red-400 hover:text-red-350 p-2 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Ticket"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 font-mono">
                  No confirmed nodes found matching query.
                </div>
              )}

              {/* Pagination controls */}
              {totalConfirmedPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-855 text-xs text-slate-400">
                  <span>
                    Showing Page <b>{confirmedPage}</b> of <b>{totalConfirmedPages}</b>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmedPage((p) => Math.max(1, p - 1))}
                      disabled={confirmedPage === 1}
                      className="p-1.5 bg-slate-950 border border-slate-850 hover:text-white rounded disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmedPage((p) => Math.min(totalConfirmedPages, p + 1))}
                      disabled={confirmedPage === totalConfirmedPages}
                      className="p-1.5 bg-slate-950 border border-slate-850 hover:text-white rounded disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'waiting' && (
            <div className="glass rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  FIFO Waiting List Queue Visualizer
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Demonstrates the FIFO (First-In-First-Out) queue ordering. Cancel confirmed tickets to witness waitlist promotion.
                </p>
              </div>

              {/* Visualizing FIFO Queue pointers */}
              {waitingReservations.length > 0 && (
                <div className="glass p-4 rounded-xl overflow-x-auto space-y-2">
                  <p className="text-[10px] text-amber-500 font-bold font-mono uppercase tracking-widest">
                    FIFO Queue Node Connection
                  </p>
                  <div className="flex items-center gap-2 min-w-max pb-2 pt-1">
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                      Front (Head)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

                    {waitingReservations.map((res, index) => (
                      <React.Fragment key={res.id}>
                        <div className="flex flex-col bg-slate-900/40 border border-slate-700/50 p-3 rounded-xl text-[10px] font-mono shadow-inner max-w-[130px] node-link">
                          <span className="text-slate-200 font-bold truncate max-w-[110px]">
                            {res.name}
                          </span>
                          <span className="text-amber-500 text-[8px] mt-0.5">Pos: #{index + 1}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      </React.Fragment>
                    ))}

                    <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-900/40 text-slate-500 border border-slate-800 rounded">
                      Rear (Tail)
                    </span>
                  </div>
                </div>
              )}

              {/* Waiting list table */}
              {waitingReservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                      <tr>
                        <th className="px-5 py-3">Queue Position</th>
                        <th className="px-5 py-3">Passenger Details</th>
                        <th className="px-5 py-3">Phone / Contact</th>
                        <th className="px-5 py-3">Date Registered</th>
                        <th className="px-5 py-3 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {waitingReservations.map((res, index) => (
                        <tr key={res.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="px-5 py-3 font-mono text-sm font-bold text-amber-500">
                            #{index + 1}
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-slate-200">{res.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {res.age} yrs | {res.gender} | ID: {res.id}
                            </div>
                          </td>
                          <td className="px-5 py-3 font-mono">
                            <div className="text-slate-300">{res.phone}</div>
                            <div className="text-[10px] text-slate-500">{res.email}</div>
                          </td>
                          <td className="px-5 py-3 text-slate-400 font-mono">
                            {new Date(res.bookingTime).toLocaleString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleCancelTicket(res.id, res.name)}
                              className="text-red-400 hover:text-red-350 p-2 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Remove waiting node"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 font-mono text-sm border border-dashed border-slate-800 rounded-xl">
                  Waiting Queue is empty. No passengers in queue.
                </div>
              )}
            </div>
          )}

          {activeTab === 'cancellations' && (
            <div className="glass rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Cancellations & System Promotion Logs
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    History of cancelled seats.
                  </p>
                </div>
                {cancellations.length > 0 && (
                  <button
                    onClick={handleClearAllLogs}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-350 font-semibold font-mono border border-red-900/30 hover:border-red-500/50 rounded-xl text-xs transition-all cursor-pointer shadow-sm w-fit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All Logs
                  </button>
                )}
              </div>

              {cancellations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                      <tr>
                        <th className="px-5 py-3">Passenger</th>
                        <th className="px-5 py-3">Phone</th>
                        <th className="px-5 py-3">Seat Released</th>
                        <th className="px-5 py-3">Cancelled By</th>
                        <th className="px-5 py-3 font-mono">Time Logged</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {cancellations.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-semibold text-slate-200">{log.name}</div>
                            <div className="text-[10px] text-slate-400">{log.email}</div>
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-300">{log.phone}</td>
                          <td className="px-5 py-3">
                            <span className="text-red-400 font-mono font-bold bg-red-950/40 border border-red-900/30 px-2.5 py-0.5 rounded-md text-[10px]">
                              Seat {log.seatNumber > 0 ? `#${log.seatNumber}` : 'WL'}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-400">{log.cancelledBy || 'User'}</td>
                          <td className="px-5 py-3 font-mono text-slate-400">
                            {new Date(log.cancelledAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDeleteLog(log.id, log.name)}
                              className="text-red-400 hover:text-red-350 p-2 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Delete log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 font-mono">
                  No system cancellations recorded yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="glass rounded-2xl p-6 shadow-2xl max-w-xl mx-auto space-y-4">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  System Configuration Panel
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust maximum seating limits and FIFO waiting list boundaries.
                </p>
              </div>

              <form onSubmit={handleUpdateConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">
                    TRAIN BERTHS CAPACITY (MAX SEATS)
                  </label>
                  <input
                    type="number"
                    value={seatsInput}
                    onChange={(e) => setSeatsInput(e.target.value)}
                    disabled={updatingConfig}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    Altering this will affect future bookings. Seat numbers are dynamically allocated. Range: 1 - 100.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">
                    FIFO WAITLIST CAPACITY (MAX QUEUE LENGTH)
                  </label>
                  <input
                    type="number"
                    value={waitingInput}
                    onChange={(e) => setWaitingInput(e.target.value)}
                    disabled={updatingConfig}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    Maximum waitlist buffer before throwing bookings full exception. Range: 0 - 50.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={updatingConfig}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer disabled:opacity-50 text-xs font-bold uppercase tracking-wider mt-4"
                >
                  {updatingConfig ? 'Synchronizing parameters...' : 'Update Train Parameters'}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setTicketIdToCancel(null);
          setPassengerNameToCancel('');
        }}
        onConfirm={onConfirmCancel}
        title="Cancel Reservation"
        message={`Are you sure you want to cancel the reservation for ${passengerNameToCancel || 'this passenger'}? This action cannot be undone.`}
      />

      <ConfirmModal
        isOpen={confirmDeleteLogOpen}
        onClose={() => {
          setConfirmDeleteLogOpen(false);
          setLogIdToDelete(null);
          setLogNameToDelete('');
        }}
        onConfirm={onConfirmDeleteLog}
        title="Delete Cancellation Log"
        message={`Are you sure you want to permanently delete the cancellation log for "${logNameToDelete || 'this passenger'}"? This action cannot be undone.`}
      />

      <ConfirmModal
        isOpen={confirmClearAllOpen}
        onClose={() => setConfirmClearAllOpen(false)}
        onConfirm={onConfirmClearAll}
        title="Clear All Cancellation Logs"
        message="Are you sure you want to permanently delete ALL cancellation logs? This action cannot be undone."
      />
    </div>
  );
};
