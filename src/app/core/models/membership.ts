export interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // Duración en meses
  features: string[]; // Array de características
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

