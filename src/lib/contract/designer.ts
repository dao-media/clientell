import { LEGAL_DEFAULTS } from './defaults';

/** Owner identity that fills the designer slots in contracts (pulled from the admin profile). */
export type DesignerIdentity = {
	/** Full legal line, e.g. "Jane Doe / Doe Studio". */
	name: string;
	/** Business / brand / DBA. */
	short: string;
	/** Person's display name, e.g. "Jane Doe". */
	display: string;
	email: string;
	phone: string;
	website: string;
	socialLinks: Array<{ label: string; url: string }>;
};

export const FALLBACK_DESIGNER: DesignerIdentity = {
	name: LEGAL_DEFAULTS.designerName,
	short: LEGAL_DEFAULTS.designerShort,
	display: LEGAL_DEFAULTS.designerDisplay,
	email: '',
	phone: '',
	website: '',
	socialLinks: []
};

export function designerFromProfile(
	profile: {
		firstName: string;
		lastName: string;
		businessName: string;
		email: string;
		phone: string | null;
		website: string | null;
		socialLinks: Array<{ label: string; url: string }> | null;
	} | null
): DesignerIdentity {
	if (!profile) return FALLBACK_DESIGNER;
	const display = `${profile.firstName} ${profile.lastName}`.trim();
	const business = profile.businessName.trim();
	return {
		name: business && business !== display ? `${display} / ${business}` : display,
		short: business || display,
		display,
		email: profile.email,
		phone: profile.phone ?? '',
		website: profile.website ?? '',
		socialLinks: profile.socialLinks ?? []
	};
}
