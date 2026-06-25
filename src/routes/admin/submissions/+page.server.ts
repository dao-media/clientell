import { submissionBriefActions } from '$lib/server/submission-brief-actions';
import { loadSubmissionsPage } from '$lib/server/submissions-page';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return loadSubmissionsPage(event, 'all');
};

export const actions = submissionBriefActions satisfies Actions;
