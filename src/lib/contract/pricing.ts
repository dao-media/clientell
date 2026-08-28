import { LEGAL_DEFAULTS } from './defaults';
import { roundCents } from './money';
import { TIER_PREMIUM_PCT, type ConfidentialityTier } from './types';

export type PricingInput = {
	baseFee: number;
	confidentiality: boolean;
	confidentialityTier: ConfidentialityTier | null;
	premiumPct: number;
	premiumFloor: number;
};

export type PricingResult = {
	baseFee: number;
	confidentialityPremium: number;
	total: number;
	deposit: number;
	remaining: number;
	premiumPct: number;
};

export function defaultPremiumPct(tier: ConfidentialityTier | null): number {
	if (!tier) return 0;
	return TIER_PREMIUM_PCT[tier];
}

export function computePricing(input: PricingInput): PricingResult {
	const baseFee = Math.max(0, roundCents(input.baseFee));
	const premiumPct = Number.isFinite(input.premiumPct) ? input.premiumPct : 0;

	let confidentialityPremium = 0;
	if (input.confidentiality && input.confidentialityTier) {
		const pctAmount = roundCents((premiumPct / 100) * baseFee);
		if (input.confidentialityTier === 1) {
			confidentialityPremium = pctAmount;
		} else {
			const floor = Math.max(0, roundCents(input.premiumFloor || LEGAL_DEFAULTS.premiumFloorCents));
			confidentialityPremium = Math.max(pctAmount, floor);
		}
	}

	const total = baseFee + confidentialityPremium;
	const deposit = roundCents((LEGAL_DEFAULTS.depositPct / 100) * total);
	const remaining = total - deposit;

	return {
		baseFee,
		confidentialityPremium,
		total,
		deposit,
		remaining,
		premiumPct
	};
}
