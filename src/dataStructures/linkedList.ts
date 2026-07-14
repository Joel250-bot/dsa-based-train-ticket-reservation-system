/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Reservation } from '../types';

/**
 * Node class representing a single passenger node in the Singly Linked List.
 */
export class PassengerNode {
  public passengerId: string;
  public name: string;
  public age: number;
  public gender: string;
  public phone: string;
  public email: string;
  public seatNumber: number;
  public bookingTime: number;
  public status: 'Confirmed' | 'Waiting';
  public next: PassengerNode | null = null;

  constructor(data: Reservation) {
    this.passengerId = data.id;
    this.name = data.name;
    this.age = data.age;
    this.gender = data.gender;
    this.phone = data.phone;
    this.email = data.email;
    this.seatNumber = data.seatNumber;
    this.bookingTime = data.bookingTime;
    this.status = data.status;
  }

  /**
   * Converts the node data back to a plain Reservation object.
   */
  public toReservation(trainNumber: string = 'EXP101'): Reservation {
    return {
      id: this.passengerId,
      name: this.name,
      age: this.age,
      gender: this.gender,
      phone: this.phone,
      email: this.email,
      seatNumber: this.seatNumber,
      bookingTime: this.bookingTime,
      status: this.status,
      trainNumber,
    };
  }
}

/**
 * Custom Singly Linked List to manage all Confirmed passengers.
 * Demonstrates basic linked list operations: insertion, search, update, deletion, and traversal.
 */
export class SinglyLinkedList {
  private head: PassengerNode | null = null;
  private size: number = 0;

  /**
   * Inserting a passenger at the end of the list.
   * Time Complexity: O(N) where N is size of the list.
   * Can be optimized to O(1) with a tail pointer, but we do standard traversal to showcase standard DSA logic.
   */
  public insertPassenger(data: Reservation): void {
    const newNode = new PassengerNode(data);
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next !== null) {
        current = current.next;
      }
      current.next = newNode;
    }
    this.size++;
  }

  /**
   * Deletes a passenger node by passengerId.
   * Time Complexity: O(N) as we have to scan the list.
   */
  public deletePassenger(passengerId: string): boolean {
    if (!this.head) return false;

    // If head node itself is the node to be deleted
    if (this.head.passengerId === passengerId) {
      this.head = this.head.next;
      this.size--;
      return true;
    }

    let prev: PassengerNode | null = null;
    let current: PassengerNode | null = this.head;

    while (current !== null && current.passengerId !== passengerId) {
      prev = current;
      current = current.next;
    }

    // If passenger is found
    if (current !== null && prev !== null) {
      prev.next = current.next;
      this.size--;
      return true;
    }

    return false; // Not found
  }

  /**
   * Searches for a passenger node by passengerId, name, or email.
   * Time Complexity: O(N)
   */
  public searchPassenger(query: string): PassengerNode | null {
    let current = this.head;
    const lowerQuery = query.toLowerCase();
    while (current !== null) {
      if (
        current.passengerId === query ||
        current.name.toLowerCase().includes(lowerQuery) ||
        current.email.toLowerCase().includes(lowerQuery)
      ) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Updates an existing passenger's profile data.
   * Time Complexity: O(N)
   */
  public updatePassenger(passengerId: string, updatedData: Partial<Reservation>): boolean {
    const node = this.searchPassenger(passengerId);
    if (!node) return false;

    if (updatedData.name !== undefined) node.name = updatedData.name;
    if (updatedData.age !== undefined) node.age = updatedData.age;
    if (updatedData.gender !== undefined) node.gender = updatedData.gender;
    if (updatedData.phone !== undefined) node.phone = updatedData.phone;
    if (updatedData.email !== undefined) node.email = updatedData.email;
    if (updatedData.seatNumber !== undefined) node.seatNumber = updatedData.seatNumber;
    
    return true;
  }

  /**
   * Returns all passengers in an array format (traversal).
   * Time Complexity: O(N)
   */
  public displayPassengers(trainNumber: string = 'EXP101'): Reservation[] {
    const list: Reservation[] = [];
    let current = this.head;
    while (current !== null) {
      list.push(current.toReservation(trainNumber));
      current = current.next;
    }
    return list;
  }

  /**
   * Gets the total count of confirmed passengers.
   * Time Complexity: O(1)
   */
  public getSize(): number {
    return this.size;
  }

  /**
   * Populates the Linked List from an array of Reservations.
   * Crucial for reconstruction when syncing with Firestore.
   */
  public fromArray(reservations: Reservation[]): void {
    this.head = null;
    this.size = 0;
    // Sort reservations by bookingTime or seatNumber to maintain correct ordering
    const sorted = [...reservations].sort((a, b) => a.bookingTime - b.bookingTime);
    for (const res of sorted) {
      this.insertPassenger(res);
    }
  }

  /**
   * Helper to retrieve the set of currently occupied seat numbers.
   */
  public getOccupiedSeats(): Set<number> {
    const seats = new Set<number>();
    let current = this.head;
    while (current !== null) {
      if (current.seatNumber > 0) {
        seats.add(current.seatNumber);
      }
      current = current.next;
    }
    return seats;
  }
}
