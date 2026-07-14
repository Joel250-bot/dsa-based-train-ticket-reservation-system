/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Download, Train, Calendar, Clock, User, Phone, Mail, Award, CheckCircle } from 'lucide-react';
import { Reservation } from '../types';
import { generatePNR, generateQRGrid, formatRailwayDate, formatRailwayTime } from '../utils/ticketGenerator';

interface TicketCardProps {
  reservation: Reservation;
  onCancel?: (id: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ reservation, onCancel }) => {
  const pnr = generatePNR(reservation);
  const qrGrid = generateQRGrid(pnr);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Create a print-friendly stylesheet dynamically
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0;
            padding: 20px;
            font-family: sans-serif;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: 2px dashed #1e3a8a !important;
            border-radius: 12px;
            padding: 24px;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            box-shadow: none !important;
            background: white !important;
          }
          .qr-pixel {
            background-color: black !important;
            print-color-adjust: exact;
          }
        }
      `;
      document.head.appendChild(style);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Train Ticket - ${pnr}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                .qr-pixel { background-color: black !important; }
              </style>
            </head>
            <body class="bg-white p-6">
              <div class="print-container border-2 border-dashed border-blue-900 rounded-xl p-6 max-w-2xl mx-auto">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const isConfirmed = reservation.status === 'Confirmed';

  return (
    <div className="relative group">
      {/* Visual Ticket Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Ticket Header */}
        <div className={`p-4 ${isConfirmed ? 'bg-blue-600/10' : 'bg-amber-500/10'} border-b border-slate-800 flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white tracking-wider text-[10px] uppercase font-mono">INDIAN RAILWAYS RESERVATION</span>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
            isConfirmed ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20'
          }`}>
            {reservation.status}
          </span>
        </div>

        {/* Ticket Body - Content for printing */}
        <div ref={printRef} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Main Ticket Info */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 mb-0.5">Express 101</h3>
                  <p className="text-[10px] text-blue-500 font-mono font-bold uppercase tracking-wider">TRAIN NO: {reservation.trainNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PNR NUMBER</p>
                  <p className="text-sm font-mono font-bold text-blue-400">{pnr}</p>
                </div>
              </div>

              {/* Journey Route */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-center">
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">FROM</p>
                  <p className="text-xs font-bold text-slate-200">Delhi (NDLS)</p>
                </div>
                <div className="flex-1 px-4 relative flex items-center justify-center">
                  <div className="w-full h-px bg-slate-800 dashed"></div>
                  <Train className="w-4 h-4 text-blue-500 absolute bg-slate-950 px-0.5" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TO</p>
                  <p className="text-xs font-bold text-slate-200">Mumbai (CSMT)</p>
                </div>
              </div>

              {/* Passenger & Seat Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PASSENGER</p>
                  <p className="text-xs font-semibold text-slate-200 truncate">{reservation.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AGE / GENDER</p>
                  <p className="text-xs font-semibold text-slate-200">{reservation.age} / {reservation.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">COACH / SEAT</p>
                  <p className="text-xs font-bold text-blue-500 font-mono">
                    {isConfirmed ? `SL / Seat ${reservation.seatNumber < 10 ? `0${reservation.seatNumber}` : reservation.seatNumber}` : 'WL (N/A)'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {isConfirmed ? 'CONFIRM TIME' : 'WAITLIST POS'}
                  </p>
                  <p className="text-xs font-bold text-slate-200">
                    {isConfirmed 
                      ? formatRailwayTime(reservation.bookingTime)
                      : `#${reservation.waitingPosition || 'N/A'}`
                    }
                  </p>
                </div>
              </div>

              {/* Detailed Dates */}
              <div className="flex gap-4 text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Date: {formatRailwayDate(reservation.bookingTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Time: {formatRailwayTime(reservation.bookingTime)}
                </span>
              </div>
            </div>

            {/* QR Code Segment */}
            <div className="md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
              <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-200 flex flex-col items-center">
                {/* Dynamically Generated QR Grid */}
                <div className="grid grid-cols-15 gap-px bg-white w-32 h-32">
                  {qrGrid.flatMap((row, rIdx) =>
                    row.map((active, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`qr-pixel w-2 h-2 ${active ? 'bg-slate-900' : 'bg-white'}`}
                      />
                    ))
                  )}
                </div>
                <p className="text-[9px] text-slate-500 font-mono mt-2 tracking-wide text-center">
                  PNR VERIFIED TICKET
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Footer Actions (Excluded from prints via no-print class) */}
        <div className="no-print bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Print / Save Ticket
          </button>
          
          {onCancel && (
            <button
              onClick={() => onCancel(reservation.id)}
              className="text-xs font-semibold text-red-400 hover:text-red-300 px-3 py-2 border border-transparent hover:border-red-500/20 rounded-lg hover:bg-red-950/20 transition-all cursor-pointer"
            >
              Cancel Reservation
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
