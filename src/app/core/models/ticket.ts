import { Center } from './center';

/** Possible lifecycle states for a support ticket */
export type TicketStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Represents a support or contact request.
 */
/**
 * Represents a support or contact request.
 */
export interface Ticket {
  /** Unique identifier for the ticket */
  id: string;
  /** Name of the person who created the ticket */
  name: string;
  /** Email address for contact */
  email: string;
  /** Optional phone number */
  phone?: string | null;
  /** ID of the center the ticket is associated with */
  centerId: string;
  /** Detailed center information */
  center?: Center;
  /** Subject of the ticket */
  subject: string;
  /** Detailed description of the issue or request */
  description: string;
  /** List of URLs for file attachments */
  attachments: string[];
  /** Current status of the ticket */
  status: TicketStatus;
  /** ISO date string of resolution (if completed) */
  completedAt?: string | null;
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
}

/**
 * Data needed to create a new support ticket.
 */
export interface CreateTicketInput {
  /** Submitting person's name */
  name: string;
  /** Submitting person's email */
  email: string;
  /** Optional phone number */
  phone?: string;
  /** Associated center ID */
  centerId: string;
  /** Topic of the request */
  subject: string;
  /** Full content of the request */
  description: string;
  /** Optional file attachments */
  attachments?: string[];
}

/**
 * Data needed to update an existing ticket's status.
 */
export interface UpdateTicketInput {
  /** New status for the ticket */
  status?: TicketStatus;
}


