export type UserRole = "client" | "admin";
export type SubscriptionPlan = "starter" | "business" | "pro" | "monthly";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Subscription {
  _id: string;
  plan: SubscriptionPlan;
  status: "pending" | "active" | "canceled" | "expired";
  amount: number;
  currency: "KZT";
  startedAt: string;
  expiresAt: string;
}

export interface PlanLimits {
  calculationsPerMonth: number;
  ordersPerMonth: number;
  uploadFilesPerMonth: number;
  uploadFilesPerOrder: number;
  maxFileSizeMb: number;
  maxEmployees: number;
  allowedServiceSlugs: string[] | "*";
  allowedCategories: string[] | "*";
}

export interface SubscriptionPlanPolicy {
  plan: Exclude<SubscriptionPlan, "monthly">;
  title: string;
  description: string;
  amount: number;
  currency: "KZT";
  period: "month";
  limits: PlanLimits;
  features: string[];
}

export interface UsageSnapshot {
  /** Limits reset on every billing month inside the paid term. */
  periodStart: string;
  periodEnd: string;
  calculations: { used: number; limit: number };
  orders: { used: number; limit: number };
  uploadFiles: { used: number; limit: number };
}

export interface SubscriptionAccess {
  plan: SubscriptionPlanPolicy;
  usage: UsageSnapshot;
}
