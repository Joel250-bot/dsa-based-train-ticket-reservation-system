/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Ticket, User, Calendar, Phone, Mail, Award, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { TicketService } from '../services/ticketService';
import { Reservation } from '../types';

interface BookingFormProps {
  onBookingSuccess: (reservation: Reservation) => void;
  userEmail?: string;
  userName?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  onBookingSuccess,
  userEmail = '',
  userName = '',
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: userName,
    age: '',
    gender: 'Male',
    phone: '',
    email: userEmail,
  });
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: userName,
      email: userEmail,
    }));
  }, [userName, userEmail]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return false;
    }
    if (!formData.age || Number(formData.age) <= 0 || Number(formData.age) > 120) {
      showToast('Please enter a valid age (1-120)', 'error');
      return false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      showToast('Phone number must be exactly 10 digits', 'error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const reservation = await TicketService.bookTicket({
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        phone: formData.phone.trim(),
        email: formData.email ? formData.email.toLowerCase().trim() : '',
      });

      if (reservation.status === 'Confirmed') {
        showToast(`Ticket Booked Successfully! Confirmed Seat: ${reservation.seatNumber}`, 'success');
      } else {
        showToast(`Seats full! Placed in waiting list at Position #${reservation.waitingPosition}`, 'info');
      }

      onBookingSuccess(reservation);
      
      // Keep email and phone, clear name/age for next bookings if needed or reset
      setFormData((prev) => ({
        ...prev,
        name: userName,
        age: '',
        phone: '',
        email: userEmail,
      }));
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to book ticket. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <Ticket className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Reserve a Ticket</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Delhi (NDLS) to Mumbai (CSMT) - EXP101</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-500" /> Full Name (As on ID)
          </label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleInputChange}
            disabled={submitting}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-700 outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Age Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Age
            </label>
            <input
              type="number"
              name="age"
              placeholder="25"
              value={formData.age}
              onChange={handleInputChange}
              disabled={submitting}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-700 outline-none transition-colors"
            />
          </div>

          {/* Gender Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-500" /> Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              disabled={submitting}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Phone Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-500" /> Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="9876543210"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={submitting}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-700 outline-none transition-colors"
          />
        </div>

        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-500" /> Email Address (Optional)
          </label>
          <input
            type="email"
            name="email"
            placeholder="johndoe@example.com"
            value={formData.email}
            onChange={handleInputChange}
            disabled={submitting || !!userEmail}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-700 outline-none transition-colors disabled:opacity-50"
          />
        </div>

        {/* Book Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={submitting}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-950/45 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Ticket...
            </>
          ) : (
            <>
              <Ticket className="w-5 h-5" />
              Confirm Booking
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};
