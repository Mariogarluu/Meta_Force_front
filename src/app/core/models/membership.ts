/**
 * Represents a gymnasium membership subscription plan.
 */
export interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  /** Duration in months */
  duration: number;
  /** List of features included in the plan */
  features: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMembershipPlanInput {
  name: string;
  description?: string;
  price: number;
  duration: number;
  features?: string[];
  isActive?: boolean;
}

export interface UpdateMembershipPlanInput {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  features?: string[];
  isActive?: boolean;
}

