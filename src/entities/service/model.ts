export type ServiceInputType = "number" | "text" | "select";
export type PricingFormula = "rules_sum" | "linear";
export type PricingRuleType = "per_unit" | "per_block" | "fixed" | "tiered" | "percentage";
export type PricingConditionOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in";
export type RoundingMode = "none" | "ceil" | "floor" | "round";
export type DomainCalculationType =
  | "sole_proprietor_simplified_tax"
  | "too_cit"
  | "payroll"
  | "property_tax"
  | "income_total";

export interface ServiceParameter {
  key: string;
  label: string;
  inputType: ServiceInputType;
  required: boolean;
  defaultValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
  helpText?: string;
}

export interface PricingCondition {
  parameterKey: string;
  operator: PricingConditionOperator;
  value: number | string | Array<number | string>;
}

export interface PricingTier {
  from: number;
  to?: number;
  unitPrice: number;
}

export interface PricingRule {
  key: string;
  type: PricingRuleType;
  parameterKey: string;
  label: string;
  unitPrice?: number;
  amount?: number;
  includedQuantity?: number;
  blockSize?: number;
  rate?: number;
  tiers?: PricingTier[];
  conditions?: PricingCondition[];
  taxable?: boolean;
  sortOrder?: number;
}

export interface ServicePricing {
  currency: "KZT";
  formula: PricingFormula;
  basePrice: number;
  minimumPrice?: number;
  rounding?: {
    mode: RoundingMode;
    precision: number;
  };
  rules: PricingRule[];
}

export interface AccountingService {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  isActive: boolean;
  parameters: ServiceParameter[];
  pricing: ServicePricing;
  domainCalculation?: {
    type: DomainCalculationType;
    label: string;
    defaults?: Record<string, number | string>;
  };
}
