/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Reservation {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  seatNumber: number; // -1 if Waiting
  bookingTime: number; // timestamp
  status: 'Confirmed' | 'Waiting';
  waitingPosition?: number; // 1-indexed queue position
  trainNumber: string;
}

export interface TrainConfig {
  name: string;
  number: string;
  source: string;
  destination: string;
  totalSeats: number;
  waitingCapacity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'passenger';
}
