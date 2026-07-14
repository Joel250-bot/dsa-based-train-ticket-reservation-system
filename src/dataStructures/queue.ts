/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Reservation } from '../types';

/**
 * Queue Node class representing a waiting passenger in the FIFO queue.
 */
class QueueNode {
  public data: Reservation;
  public next: QueueNode | null = null;

  constructor(data: Reservation) {
    this.data = data;
  }
}

/**
 * Custom Queue (First In, First Out - FIFO) structure to manage the Waiting List.
 * Demonstrates standard queue operations: enqueue, dequeue, peek, isEmpty, and display.
 */
export class PassengerQueue {
  private front: QueueNode | null = null;
  private rear: QueueNode | null = null;
  private size: number = 0;

  /**
   * Adds a waiting passenger to the rear of the queue.
   * Time Complexity: O(1)
   */
  public enqueue(data: Reservation): void {
    const newNode = new QueueNode(data);
    if (this.isEmpty()) {
      this.front = newNode;
      this.rear = newNode;
    } else {
      if (this.rear) {
        this.rear.next = newNode;
        this.rear = newNode;
      }
    }
    this.size++;
  }

  /**
   * Removes and returns the passenger at the front of the queue (longest-waiting).
   * Time Complexity: O(1)
   */
  public dequeue(): Reservation | null {
    if (this.isEmpty() || !this.front) {
      return null;
    }
    const dequeuedNode = this.front;
    this.front = this.front.next;

    if (this.front === null) {
      this.rear = null;
    }

    this.size--;
    return dequeuedNode.data;
  }

  /**
   * Returns the data of the first passenger without removing them.
   * Time Complexity: O(1)
   */
  public peek(): Reservation | null {
    if (this.isEmpty() || !this.front) {
      return null;
    }
    return this.front.data;
  }

  /**
   * Checks if the queue is empty.
   * Time Complexity: O(1)
   */
  public isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Returns the total number of waiting passengers in the queue.
   * Time Complexity: O(1)
   */
  public getSize(): number {
    return this.size;
  }

  /**
   * Returns all waiting passengers as an array, adding a 1-indexed waitingPosition.
   * Time Complexity: O(N) where N is queue size.
   */
  public displayQueue(): Reservation[] {
    const list: Reservation[] = [];
    let current = this.front;
    let position = 1;

    while (current !== null) {
      list.push({
        ...current.data,
        waitingPosition: position++,
      });
      current = current.next;
    }
    return list;
  }

  /**
   * Populates the Queue from an array of waiting reservations.
   * Crucial for recreating the exact waitlist state from Firestore.
   */
  public fromArray(reservations: Reservation[]): void {
    this.front = null;
    this.rear = null;
    this.size = 0;
    // Sort by booking time to respect FIFO ordering
    const sorted = [...reservations].sort((a, b) => a.bookingTime - b.bookingTime);
    for (const res of sorted) {
      this.enqueue(res);
    }
  }

  /**
   * Special utility: Removes a specific waiting passenger from the queue (e.g., if they cancel).
   * Since this is a custom Queue, we can traverse it, filter the matching node, and rebuild the links.
   * Time Complexity: O(N)
   */
  public removePassenger(passengerId: string): boolean {
    if (this.isEmpty() || !this.front) return false;

    // Case 1: Match at front of the queue
    if (this.front.data.id === passengerId) {
      this.front = this.front.next;
      if (this.front === null) {
        this.rear = null;
      }
      this.size--;
      return true;
    }

    let current = this.front;
    let prev: QueueNode | null = null;

    while (current !== null && current.data.id !== passengerId) {
      prev = current;
      current = current.next;
    }

    // Case 2: Match in middle or rear
    if (current !== null && prev !== null) {
      prev.next = current.next;
      if (current === this.rear) {
        this.rear = prev;
      }
      this.size--;
      return true;
    }

    return false; // Not found
  }
}
