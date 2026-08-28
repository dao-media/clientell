/** Fixed legal defaults. Promote to per-contract overrides later if needed. */
export const LEGAL_DEFAULTS = {
	designerName: "Dane O'Leary / Dane O'Leary Media",
	designerShort: "Dane O'Leary Media",
	designerDisplay: "Dane O'Leary",
	documentUpdatedAt: new Date('2026-08-02T12:00:00'),
	depositPct: 35,
	remainingPct: 65,
	invoiceDueDays: 7,
	lateFeeGraceDays: 14,
	lateFeePct: 1.5,
	lateFeeFloorCents: 5000,
	collectionsDays: 28,
	responseSlaDays: 3,
	dormancyPauseDays: 7,
	dormancyInactiveDays: 14,
	acceptanceWindowDays: 5,
	warrantyDays: 30,
	reengagementFeeCents: 50000,
	confidentialityDuration: 'indefinitely',
	governingState: 'West Virginia',
	overageRateCents: 6500,
	handlingPct: 12,
	perItemThresholdCents: 10000,
	premiumFloorCents: 75000
} as const;

export const RATE_HINTS = {
	premiumPct: {
		1: '10% · attribution waiver',
		2: '20% · 25–30% flagship',
		3: '30% · 25–30% flagship stacked'
	},
	handlingPct: '10–15%',
	premiumFloor: 'Floor ~$750 for tiers 2–3',
	perItemThreshold: 'Typical threshold $100',
	overageRate: 'Default $65/hour'
} as const;
