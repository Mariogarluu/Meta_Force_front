/**
 * Represents a gymnasium membership subscription plan.
 */
/**
 * Represents a gymnasium membership subscription plan.
 */
export interface MembershipPlan {
  /** Unique identifier for the plan */
  id: string;
  /** Display name of the plan */
  name: string;
  /** Optional description of what the plan offers */
  description?: string;
  /** Cost of the plan */
  price: number;
  /** Duration of the subscription in months */
  duration: number;
  /** List of features included in the plan */
  features: string[];
  /** Whether the plan is currently available for purchase */
  isActive: boolean;
  /** ISO date string of creation */
  createdAt?: string;
  /** ISO date string of last update */
  updatedAt?: string;
}

/**
 * Data needed to create a new membership plan.
 */
export interface CreateMembershipPlanInput {
  /** Plan name */
  name: string;
  /** Plan description */
  description?: string;
  /** Plan price */
  price: number;
  /** Duration in months */
  duration: number;
  /** Included features */
  features?: string[];
  /** Initial active status */
  isActive?: boolean;
}

/**
 * Data needed to update an existing membership plan.
 */
export interface UpdateMembershipPlanInput {
  /** Updated plan name */
  name?: string;
  /** Updated plan description */
  description?: string;
  /** Updated price */
  price?: number;
  /** Updated duration in months */
  duration?: number;
  /** Updated feature list */
  features?: string[];
  /** Updated active status */
  isActive?: boolean;
}


