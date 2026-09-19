import type { AccountingService } from "../service/model";
import type { User } from "../user/model";

export type OrderStatus = "new" | "in_progress" | "need_info" | "done";
export type CalculationBreakdownType =
  | "base"
  | "per_unit"
  | "per_block"
  | "fixed"
  | "tiered"
  | "percentage"
  | "adjustment";

export interface CalculationBreakdownItem {
  key: string;
  type: CalculationBreakdownType;
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  meta?: Record<string, unknown>;
}

export interface OrderCalculation {
  currency: "KZT";
  subtotal: number;
  adjustmentsTotal: number;
  total: number;
  breakdown: CalculationBreakdownItem[];
  domain?: {
    type: string;
    label: string;
    currency: "KZT";
    inputs: Record<string, number | string>;
    values: Record<string, number | string | boolean>;
    breakdown: Array<{
      key: string;
      label: string;
      value: number | string | boolean;
      unit?: string;
    }>;
    warnings?: string[];
  };
}

export interface Order {
  _id: string;
  user?: User;
  service: string | AccountingService;
  serviceSnapshot: {
    name: string;
    slug: string;
    category: string;
    pricing?: {
      currency: "KZT";
      formula: string;
      basePrice: number;
      rules: unknown[];
    };
  };
  params: Record<string, number | string>;
  calculation: OrderCalculation;
  status: OrderStatus;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedDocument {
  _id: string;
  order: string;
  originalName: string;
  filename: string;
  storage?: "local" | "blob";
  mimeType: string;
  size: number;
  createdAt: string;
}
