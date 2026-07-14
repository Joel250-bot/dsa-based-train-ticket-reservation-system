/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Reservation, TrainConfig } from '../types';
import { Users, AlertTriangle, Layers, Armchair } from 'lucide-react';

interface TrainStatusProps {
  trainConfig: TrainConfig;
  confirmedReservations: Reservation[];
  waitingReservations: Reservation[];
}

export const TrainStatus: React.FC<TrainStatusProps> = ({
  trainConfig,
  confirmedReservations,
  waitingReservations,
}) => {
  const totalSeats = trainConfig.totalSeats;
  const waitingCapacity = trainConfig.waitingCapacity;

  // Build a map of occupied seat numbers to reservation details
  const seatMap = new Map<number, Reservation>();
  confirmedReservations.forEach((res) => {
    if (res.seatNumber > 0) {
      seatMap.set(res.seatNumber, res);
    }
  });

  // Calculate stats
  const occupiedCount = confirmedReservations.length;
  const emptyCount = Math.max(0, totalSeats - occupiedCount);
  const queueCount = waitingReservations.length;
  const fillPercentage = Math.round((occupiedCount / totalSeats) * 100);

  return (
    <div className="glass rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TOTAL CAPACITY</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{totalSeats}</p>
          <span className="text-[10px] text-blue-500 font-mono font-bold uppercase tracking-widest">SEATS</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CONFIRMED SEATS</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{occupiedCount}</p>
          <span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-widest">{emptyCount} AVAILABLE</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">WAITING QUEUE</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{queueCount}</p>
          <span className="text-[10px] text-amber-500/80 font-mono font-bold uppercase tracking-widest">CAPACITY: {waitingCapacity}</span>
        </div>
      </div>

      {/* Visual Seat Map */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Seat Map Visualization
          </h4>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wide">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-800/50 border border-dashed border-slate-600 block"></span>
              <span className="text-slate-400">Empty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 block"></span>
              <span className="text-slate-300">Confirmed</span>
            </div>
          </div>
        </div>

        {/* 2D Grid Representation of Seats */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: totalSeats }).map((_, index) => {
            const seatNumber = index + 1;
            const res = seatMap.get(seatNumber);
            const isOccupied = !!res;

            return (
              <div key={seatNumber} className="relative group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`h-14 flex flex-col justify-center items-center rounded-xl font-mono transition-all text-center select-none cursor-pointer ${
                    isOccupied
                      ? 'seat-confirmed'
                      : 'seat-empty hover:bg-slate-800/30 hover:border-slate-500'
                  }`}
                >
                  <span className="text-xs font-bold">{seatNumber < 10 ? `0${seatNumber}` : seatNumber}</span>
                  <span className="text-[9px] opacity-75 uppercase">
                    {isOccupied ? res.gender.slice(0, 1) + '-' + res.age : 'EMPTY'}
                  </span>
                </motion.div>

                {/* Tooltip on Hover */}
                {isOccupied && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-2xl z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-xs font-bold text-white truncate">{res.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      Age: {res.age} | {res.gender}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Phone: {res.phone}</p>
                    <p className="text-[10px] text-blue-400 font-mono mt-1 border-t border-slate-800 pt-1">
                      Status: Confirmed
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Waitlist Queue Indicator */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Waitlist Queue Allocation
          </span>
          <span className="text-xs font-bold font-mono text-amber-400">
            {queueCount} / {waitingCapacity} Slots Filled
          </span>
        </div>

        {/* ProgressBar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
          {Array.from({ length: waitingCapacity }).map((_, index) => {
            const hasPassenger = index < queueCount;
            return (
              <div
                key={index}
                className={`flex-1 h-full border-r border-slate-950 last:border-0 transition-colors ${
                  hasPassenger ? 'bg-gradient-to-t from-amber-600 to-amber-500' : 'bg-slate-900/20'
                }`}
              />
            );
          })}
        </div>

        {queueCount > 0 ? (
          <div className="text-[10px] text-slate-400 leading-relaxed font-mono">
            First waiting passenger:{' '}
            <span className="text-amber-400 font-bold">{waitingReservations[0]?.name}</span> is next
            in line to be promoted automatically on ticket cancellation.
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 font-mono">
            Waiting queue is completely empty. New bookings will receive immediate confirmed seating.
          </div>
        )}
      </div>
    </div>
  );
};
