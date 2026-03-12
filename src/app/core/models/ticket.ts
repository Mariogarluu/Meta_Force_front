import { Center } from './center';

/** Possible lifecycle states for a support ticket */
export type TicketStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Represents a support or contact request.
 */
export interface Ticket {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  centerId: string;
  center?: Center;
  subject: string;
  description: string;
  attachments: string[];
  status: TicketStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  name: string;
  email: string;
  phone?: string;
  centerId: string;
  subject: string;
  description: string;
  attachments?: string[];
}

export interface UpdateTicketInput {
  status?: TicketStatus;
}

