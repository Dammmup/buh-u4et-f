export interface TaxRkSettings {
  year: number;
  mrp: number;
  mzp: number;
  opvRate: number;
  vosmsRate: number;
  oosmsRate: number;
  socialContributionRate: number;
  socialTaxRate: number;
  opvrRate: number;
  unifiedPaymentRate: number;
  simplifiedIpRate: number;
  simplifiedTooRate: number;
  citRate: number;
  pitRate: number;
  highPitRate: number;
  standardDeductionMrp: number;
  progressivePitThresholdMrp: number;
  simplifiedIncomeLimitMrp: number;
  dividendExemptionMrp: number;
  dividendPitRate: number;
  propertyTaxRate: number;
  ipVosmsMzpFactor: number;
  ipSocialTaxMrp: number;
  opvMaxMzp: number;
  vosmsMaxMzp: number;
  oosmsMaxMzp: number;
  socialContributionMinMzp: number;
  socialContributionMaxMzp: number;
  opvrMinMzp: number;
  opvrMaxMzp: number;
}

export type TariffForm = "ip" | "too";
export type TariffRegime = "simplified" | "general";
export type TariffActivity = "service" | "trade" | "production";

export interface LandingPricingSettings {
  tariffRates: Record<TariffForm, Record<TariffRegime, Record<TariffActivity, number>>>;
  urgentSurchargeRate: number;
  digitalSubmissionPrice: number;
}

export const defaultTaxRk: TaxRkSettings = {
  year: 2026,
  mrp: 4325,
  mzp: 85000,
  opvRate: 0.1,
  vosmsRate: 0.02,
  oosmsRate: 0.03,
  socialContributionRate: 0.05,
  socialTaxRate: 0.06,
  opvrRate: 0.035,
  unifiedPaymentRate: 0.248,
  simplifiedIpRate: 0.04,
  simplifiedTooRate: 0.04,
  citRate: 0.2,
  pitRate: 0.1,
  highPitRate: 0.15,
  standardDeductionMrp: 30,
  progressivePitThresholdMrp: 8500,
  simplifiedIncomeLimitMrp: 600000,
  dividendExemptionMrp: 30000,
  dividendPitRate: 0.1,
  propertyTaxRate: 0.015,
  ipVosmsMzpFactor: 1.4,
  ipSocialTaxMrp: 2,
  opvMaxMzp: 50,
  vosmsMaxMzp: 20,
  oosmsMaxMzp: 40,
  socialContributionMinMzp: 1,
  socialContributionMaxMzp: 7,
  opvrMinMzp: 1,
  opvrMaxMzp: 50
};

export const defaultLandingPricing: LandingPricingSettings = {
  tariffRates: {
    ip: {
      simplified: { service: 50000, trade: 75000, production: 130000 },
      general: { service: 100000, trade: 140000, production: 170000 }
    },
    too: {
      simplified: { service: 75000, trade: 100000, production: 145000 },
      general: { service: 150000, trade: 200000, production: 230000 }
    }
  },
  urgentSurchargeRate: 0.5,
  digitalSubmissionPrice: 5000
};
