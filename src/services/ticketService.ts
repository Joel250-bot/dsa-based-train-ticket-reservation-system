/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Reservation, TrainConfig } from '../types';
import { SinglyLinkedList } from '../dataStructures/linkedList';
import { PassengerQueue } from '../dataStructures/queue';

// Default Train Configuration
const DEFAULT_TRAIN: TrainConfig = {
  name: 'Express 101',
  number: 'EXP101',
  source: 'Delhi (NDLS)',
  destination: 'Mumbai (CSMT)',
  totalSeats: 6,
  waitingCapacity: 50,
};

/**
 * Service to manage train configurations and ticket reservations.
 * Implements the core DSA logic with Firestore synchronization.
 */
export class TicketService {
  private static trainConfigCache: TrainConfig | null = null;

  /**
   * Fetches the current train configuration from Firestore.
   * If none exists, creates the default train.
   */
  public static async getTrainConfig(): Promise<TrainConfig> {
    if (this.trainConfigCache) {
      return this.trainConfigCache;
    }

    try {
      const trainDocRef = doc(db, 'trains', 'EXP101');
      const trainSnapshot = await getDoc(trainDocRef);

      if (trainSnapshot.exists()) {
        const data = trainSnapshot.data() as TrainConfig;
        this.trainConfigCache = data;
      } else {
        // Seed default train details
        await setDoc(trainDocRef, DEFAULT_TRAIN);
        this.trainConfigCache = DEFAULT_TRAIN;
      }
      return this.trainConfigCache;
    } catch (error) {
      console.error('Error fetching train config:', error);
      return DEFAULT_TRAIN; // Fallback
    }
  }

  /**
   * Updates train details (Admin operation).
   */
  public static async updateTrainConfig(config: TrainConfig): Promise<void> {
    try {
      const trainDocRef = doc(db, 'trains', 'EXP101');
      await setDoc(trainDocRef, config);
      this.trainConfigCache = config;
    } catch (error) {
      console.error('Error updating train config:', error);
      throw new Error('Failed to update train details.');
    }
  }

  /**
   * Helper to determine if a booking has expired (held for more than 15 minutes).
   */
  public static isExpired(bookingTime: number): boolean {
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    return bookingTime < fifteenMinutesAgo;
  }

  /**
   * Recreates the current state of reservations in-memory.
   * Loads all active reservations from Firestore, then populates the custom
   * Singly Linked List (Confirmed) and custom FIFO Queue (Waiting List).
   */
  public static async reconstructState(): Promise<{
    linkedList: SinglyLinkedList;
    queue: PassengerQueue;
  }> {
    const linkedList = new SinglyLinkedList();
    const queue = new PassengerQueue();

    try {
      // Query all reservations for train EXP101
      const q = query(collection(db, 'reservations'), where('trainNumber', '==', 'EXP101'));
      const querySnapshot = await getDocs(q);

      const activeReservations: Reservation[] = [];
      const now = Date.now();
      const deletePromises: Promise<any>[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const bookingTime = Number(data.bookingTime) || now;

        if (this.isExpired(bookingTime)) {
          deletePromises.push(deleteDoc(doc(db, 'reservations', docSnap.id)));
          return;
        }

        activeReservations.push({
          id: docSnap.id,
          name: data.name,
          age: Number(data.age),
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          seatNumber: Number(data.seatNumber),
          bookingTime: bookingTime,
          status: data.status,
          trainNumber: data.trainNumber,
        });
      });

      if (deletePromises.length > 0) {
        // Run in background / parallel to avoid blocking the first render
        Promise.all(deletePromises).catch((err) => console.error('Error during automatic pruning:', err));
      }

      // Filter and separate Confirmed and Waiting lists
      const confirmedList = activeReservations.filter((r) => r.status === 'Confirmed');
      const waitingList = activeReservations.filter((r) => r.status === 'Waiting');

      // Populate custom Singly Linked List (automatically sorted by booking time)
      linkedList.fromArray(confirmedList);

      // Populate custom FIFO Queue (automatically sorted by booking time)
      queue.fromArray(waitingList);

      return { linkedList, queue };
    } catch (error) {
      console.error('Error reconstructing DSA states:', error);
      return { linkedList, queue };
    }
  }

  /**
   * Books a ticket for a passenger.
   * Algorithm:
   * 1. Reconstruct current state (Linked List & Queue) from Firestore.
   * 2. Prevent duplicate bookings (check if email/phone already has a reservation).
   * 3. If Confirmed count < total seats:
   *      - Assign first free seat number from [1...totalSeats].
   *      - Add passenger node to Linked List.
   *      - Create Firestore reservation document with status 'Confirmed'.
   * 4. Else if Confirmed is full but Queue size < waiting capacity:
   *      - Add passenger to Queue.
   *      - Create Firestore reservation document with status 'Waiting'.
   * 5. Else:
   *      - Throw error: No seats/waiting room available.
   */
  public static async bookTicket(passenger: {
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
  }): Promise<Reservation> {
    const config = await this.getTrainConfig();
    const { linkedList, queue } = await this.reconstructState();

    // 1. Prevent duplicate bookings (by active email or phone)
    const existingConfirmed = linkedList.displayPassengers();
    const existingWaiting = queue.displayQueue();
    const allActive = [...existingConfirmed, ...existingWaiting];

    const isDuplicate = allActive.some((r) => {
      const emailMatch = r.email && passenger.email && r.email.trim() !== '' && passenger.email.trim() !== '' && r.email.toLowerCase() === passenger.email.toLowerCase();
      const phoneMatch = r.phone && passenger.phone && r.phone === passenger.phone;
      return emailMatch || phoneMatch;
    });

    if (isDuplicate) {
      throw new Error('Duplicate booking detected. A passenger with this email or phone is already registered.');
    }

    const bookingTime = Date.now();
    const totalSeats = config.totalSeats;

    if (linkedList.getSize() < totalSeats) {
      // Confirmed status
      // Find the first empty seat index
      const occupied = linkedList.getOccupiedSeats();
      let assignedSeat = -1;
      for (let i = 1; i <= totalSeats; i++) {
        if (!occupied.has(i)) {
          assignedSeat = i;
          break;
        }
      }

      const resData: Omit<Reservation, 'id'> = {
        name: passenger.name,
        age: passenger.age,
        gender: passenger.gender,
        phone: passenger.phone,
        email: passenger.email,
        seatNumber: assignedSeat,
        bookingTime,
        status: 'Confirmed',
        trainNumber: config.number,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'reservations'), resData);
      
      // Add in-memory
      const finalReservation: Reservation = { id: docRef.id, ...resData };
      linkedList.insertPassenger(finalReservation);

      return finalReservation;
    } else if (queue.getSize() < config.waitingCapacity) {
      // Waiting status
      const resData: Omit<Reservation, 'id'> = {
        name: passenger.name,
        age: passenger.age,
        gender: passenger.gender,
        phone: passenger.phone,
        email: passenger.email,
        seatNumber: -1,
        bookingTime,
        status: 'Waiting',
        trainNumber: config.number,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'reservations'), resData);
      const finalReservation: Reservation = { id: docRef.id, ...resData };
      
      // Add in-memory
      queue.enqueue(finalReservation);

      // Return with dynamic waiting list position
      return {
        ...finalReservation,
        waitingPosition: queue.getSize(),
      };
    } else {
      throw new Error('Booking failed. All seats and waiting list capacities are fully occupied!');
    }
  }

  /**
   * Cancels a passenger reservation.
   * Algorithm:
   * 1. Reconstruct current state (Linked List & Queue) from Firestore.
   * 2. Find the reservation.
   * 3. Move the cancelled reservation details into the 'cancellations' Firestore collection for history logs.
   * 4. Remove from reservations Firestore collection.
   * 5. If was Confirmed:
   *      - Delete passenger from Linked List.
   *      - If Queue is not empty:
   *          - Dequeue the first waiting passenger.
   *          - Assign the freed seat number to this promoted passenger.
   *          - Set their status to 'Confirmed'.
   *          - Insert them into the Linked List.
   *          - Update their document in Firestore reservations (status = Confirmed, seatNumber).
   * 6. If was Waiting:
   *      - Delete passenger from Queue using custom removal.
   */
  public static async cancelTicket(id: string, cancelledBy: string = 'User'): Promise<{
    promotedPassenger: Reservation | null;
  }> {
    const { linkedList, queue } = await this.reconstructState();
    
    // Find the record
    const docRef = doc(db, 'reservations', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Ticket not found or already cancelled.');
    }

    const reservation = { id: docSnap.id, ...docSnap.data() } as Reservation;
    const isConfirmed = reservation.status === 'Confirmed';
    const freedSeat = reservation.seatNumber;

    // Log the cancellation to cancellations collection
    await addDoc(collection(db, 'cancellations'), {
      ...reservation,
      cancelledAt: Date.now(),
      cancelledBy,
    });

    // Remove the ticket document
    await deleteDoc(docRef);

    let promotedPassenger: Reservation | null = null;

    if (isConfirmed) {
      // Remove from Linked List
      linkedList.deletePassenger(id);

      // Check if anyone is waiting in Queue to be promoted
      if (!queue.isEmpty()) {
        const firstInWaitlist = queue.dequeue();
        if (firstInWaitlist) {
          // Promote passenger
          const updatedWaitingPassenger: Reservation = {
            ...firstInWaitlist,
            status: 'Confirmed',
            seatNumber: freedSeat,
          };

          // Update Firestore for promoted passenger
          const promotedDocRef = doc(db, 'reservations', firstInWaitlist.id);
          await updateDoc(promotedDocRef, {
            status: 'Confirmed',
            seatNumber: freedSeat,
          });

          // Insert into Linked List
          linkedList.insertPassenger(updatedWaitingPassenger);
          promotedPassenger = updatedWaitingPassenger;
        }
      }
    } else {
      // Was in waiting list, remove from Queue
      queue.removePassenger(id);
    }

    return { promotedPassenger };
  }

  /**
   * Fetches booking history of a specific user by email.
   */
  public static async getUserBookings(email: string): Promise<{
    active: Reservation[];
    cancelled: any[];
  }> {
    try {
      // Active reservations
      const qActive = query(
        collection(db, 'reservations'),
        where('email', '==', email)
      );
      const snapActive = await getDocs(qActive);
      const active: Reservation[] = [];
      const now = Date.now();
      const deletePromises: Promise<any>[] = [];

      snapActive.forEach((snap) => {
        const data = snap.data();
        const bookingTime = Number(data.bookingTime) || now;

        if (this.isExpired(bookingTime)) {
          deletePromises.push(deleteDoc(doc(db, 'reservations', snap.id)));
          return;
        }

        active.push({
          id: snap.id,
          name: data.name,
          age: Number(data.age),
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          seatNumber: Number(data.seatNumber),
          bookingTime: bookingTime,
          status: data.status,
          trainNumber: data.trainNumber,
        } as Reservation);
      });

      if (deletePromises.length > 0) {
        Promise.all(deletePromises).catch((err) => console.error('Error during automatic pruning:', err));
      }

      // Cancelled reservations
      const qCancel = query(
        collection(db, 'cancellations'),
        where('email', '==', email)
      );
      const snapCancel = await getDocs(qCancel);
      const cancelled: any[] = [];
      snapCancel.forEach((snap) => {
        cancelled.push({ id: snap.id, ...snap.data() });
      });

      // We need to resolve waiting list positions for active waiting tickets
      if (active.some((r) => r.status === 'Waiting')) {
        const { queue } = await this.reconstructState();
        const displayQ = queue.displayQueue();
        active.forEach((r, idx) => {
          if (r.status === 'Waiting') {
            const foundInQ = displayQ.find((qItem) => qItem.id === r.id);
            if (foundInQ) {
              active[idx].waitingPosition = foundInQ.waitingPosition;
            }
          }
        });
      }

      return { active, cancelled };
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return { active: [], cancelled: [] };
    }
  }

  /**
   * Fetches all cancellations in the system (Admin only).
   */
  public static async getAllCancellations(): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'cancellations'));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list.sort((a, b) => b.cancelledAt - a.cancelledAt);
    } catch (error) {
      console.error('Error fetching all cancellations:', error);
      return [];
    }
  }

  /**
   * Deletes a specific cancellation log by ID (Admin only).
   */
  public static async deleteCancellation(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'cancellations', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting cancellation log:', error);
      throw new Error('Failed to delete cancellation log.');
    }
  }

  /**
   * Clears all cancellation logs from the database (Admin only).
   */
  public static async clearAllCancellations(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'cancellations'));
      const deletePromises: Promise<any>[] = [];
      snap.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, 'cancellations', docSnap.id)));
      });
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error('Error clearing cancellation logs:', error);
      throw new Error('Failed to clear cancellation logs.');
    }
  }
}
