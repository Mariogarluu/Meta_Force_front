/** Priority levels for notifications */
export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

/**
 * Represents a system notification for the user.
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Title or headline of the notification */
  title: string;
  /** Main content or body of the message */
  message: string;
  /** Type/Priority level of the notification */
  type: NotificationType;
  /** Whether the notification has been marked as read */
  read: boolean;
  /** Optional deep-link URL associated with the notification */
  link?: string;
  /** ISO date string of when the notification was sent */
  createdAt: string;
}