import type { ClauseSeed } from './types';

export const CLAUSE_SEEDS: ClauseSeed[] = [
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 0,
		sectionNumber: '0',
		title: 'Preamble',
		body: `This Agreement, entered into on {{effective_date}}, is by and between **{{designer_display}}** ("Designer," "I," "me") and **{{legal_name}}** ("the Client," "you").
Together, the Designer and Client are "Parties."

||

This Agreement governs the project described in the attached Statement of Work (SOW / Exhibit A).
Where the SOW and this Agreement conflict, the SOW controls for project-specific details; this Agreement controls for legal terms.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 10,
		sectionNumber: '1',
		title: 'Scope of Work',
		body: `1.1. Designer will provide the services and deliverables described in the Statement of Work document (see Exhibit A).

1.2. Anything not listed in Exhibit A is out of scope. Out-of-scope requests are handled under Section 2 (Changes).

1.3. **Revisions.** The SOW specifies the number of included revision rounds per deliverable ({{revision_rounds_summary}}).
A "round" is one consolidated set of feedback. Additional rounds are billed at Designer's hourly rate of {{overage_rate_formatted}}/hour.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 20,
		sectionNumber: '2',
		title: 'Changes & Additional Work',
		body: `2.1. Either Party may request changes. No change is binding until described in writing and approved by both Parties (email is sufficient).

2.2. Approved changes that increase time or cost are billed at {{overage_rate_formatted}}/hour or a new agreed flat fee, and may extend the timeline.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 30,
		sectionNumber: '3',
		title: 'Payment Schedule & Fees',
		body: `3.1. **Total project fee: {{total_formatted}}** (as itemized in Exhibit A), exclusive of third-party costs (Section 8) and applicable taxes. Projects are custom-priced to spec as a flat fee, not hourly. Designer's hourly rate of {{overage_rate_formatted}}/hour applies only to overages—additional revision rounds (1.3), out-of-scope or additional work (Section 2), and support beyond the warranty window (Section 13).

3.2. **Deposit — {{deposit_pct}}%.** A deposit of {{deposit_pct}}% of the total fee ({{deposit_formatted}}) is due after the initial consultation and before any work begins. This deposit reserves Designer's time and is non-refundable except as stated in Section 6. The deposit is credited against the final balance.

3.3. **Deposit timing determines the schedule.** The project start date and timeline in Exhibit A are contingent on timely receipt of the deposit.
Received with 10 calendar days: Secures the start date estimated in Exhibit A.
Received in 11 to 21 calendar days: Estimated start date can no longer be guaranteed. The project enters Designer's regular queue and will begin when capacity allows, given other active clients and onboarding.
After more than 21 calendar days (3 weeks): Designer will treat the project as not moving forward and will release the reserved capacity.
Note: This is not a cancellation penalty as the Client may re-engage at any time and the Designer will resume from where things left off, subject to availability and pricing.

3.4. **Remaining balance.** The remaining {{remaining_pct}}% is invoiced {{remaining_structure_label}}.

3.5. **Delivery on payment.** Final files, source assets, production access, and transfer of ownership (Section 9) occur only after payment in full. Designer may withhold delivery and suspend work on any past-due balance.

3.6. **Late payments (final invoice).** Final invoices are due within {{invoice_due_days}} days. A grace period runs through day {{late_fee_grace_days}}; any balance still unpaid after day {{late_fee_grace_days}} accrues a late fee of {{late_fee_pct}}% per month (or {{late_fee_floor_formatted}}, whichever is greater) on the outstanding amount until paid. If a balance remains unpaid after {{collections_days}} days, Designer reserves the right to refer the debt to a collection agency (with collection costs borne by Client under Section 3.7).

3.7. **Costs of collection.** If Designer must pursue an unpaid balance, Client agrees to reimburse all reasonable costs of collection, including attorney's fees, collection-agency fees, and court costs.`
	},
	{
		docType: 'agreement',
		clauseType: 'module',
		moduleKey: 'personal_guarantee',
		sortOrder: 31,
		sectionNumber: '3.8',
		title: 'Personal guarantee',
		body: `3.8. The individual signing on behalf of Client personally guarantees payment of all amounts due under this Agreement.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 40,
		sectionNumber: '4',
		title: 'Client Responsibilities',
		body: `4.1. A project's success depends on the Client as much as the Designer. Client agrees to:
- Respond to questions, feedback requests, and approvals within {{response_sla_days}} business days.
- Provide all required materials (copy, images, logos, brand assets, access credentials) in usable form by the dates in Exhibit A.
- Make available one optional check-in call per week, scaling to additional calls when the work calls for it.
- Designate one primary point of contact with authority to give approvals.

4.2. **Client-caused delays.** If Client's delay in responding, approving, or supplying materials holds up the work, the timeline extends by at least the length of the delay, and Designer shall not be held responsible for missed dates caused by it.

4.3. **Dormancy / "radio silence."** If Client is unresponsive for {{dormancy_pause_days}} consecutive days without prior notice or arrangement, Designer may pause the project and reassign the reserved time. After {{dormancy_inactive_days}} days of silence, Designer may treat the project as inactive; restarting may require a re-engagement fee of {{reengagement_fee_formatted}} and a new schedule agreement. Work already completed remains billable.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 50,
		sectionNumber: '5',
		title: 'Approvals & Acceptance',
		body: `5.1. Work proceeds through documented check-ins and written approvals at the stages listed in Exhibit A. Client's written sign-off (email is sufficient) on a stage authorizes Designer to build on it.

5.2. A deliverable is accepted when Client approves it in writing or fails to submit written revisions within {{acceptance_window_days}} business days of delivery.

5.3. Because the work is guided continuously by Client's own feedback and approvals, accepted work reflects choices Client participated in and signed off on.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 60,
		sectionNumber: '6',
		title: 'Refunds',
		body: `6.1. **Design fees are non-refundable** due to the nature of design work. The process is built on frequent check-ins and client approvals, so the output is directed by Client—either in part or in whole—at each stage. Due to this visibility throughout the process, there is no point at which a finished deliverable should arrive as a total surprise.

6.2. **Good-faith adjustment.** If Designer was genuinely unable to deliver a contracted item, or a promised element of scope went unfulfilled, Designer will discuss a reduction of the remaining balance by up to 25%. This is a discretionary good-faith accommodation, is capped at 25% of the remaining (unpaid) balance, and is not an admission of fault or a waiver of any term of this Agreement.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 70,
		sectionNumber: '7',
		title: 'Cancellation & Termination',
		body: `7.1. **Client cancellation.** Client may cancel at any time with written notice. Client remains responsible for (a) the non-refundable deposit, (b) all work performed up to and including the cancellation date, and (c) any non-cancelable third-party costs already accrued on Client's behalf (Section 8).

7.2. **Designer termination.** Designer may terminate for non-payment, dormancy (Section 4.3), abusive conduct, or Client's material breach, and will be paid for work performed to that point.

7.3. Sections that by their nature should survive termination—payment, ownership/IP, confidentiality, liability, indemnity, dispute resolution—survive.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 80,
		sectionNumber: '8',
		title: 'Third-Party Costs (Hosting, Tools, Subscriptions)',
		body: `Some projects require paid third-party services (e.g., web hosting, premium plugins, stock assets, software subscriptions). Client chooses one option in Exhibit A.

8.3. **Account ownership & renewals.** Exhibit A states, for each third-party service, who owns the account and who is responsible for renewals after handoff. Designer is not responsible for recurring charges on accounts transferred to Client, and will not indefinitely carry subscriptions in Designer's own name on Client's behalf.`
	},
	{
		docType: 'agreement',
		clauseType: 'module',
		moduleKey: 'third_party_a',
		sortOrder: 81,
		sectionNumber: '8.1',
		title: 'Option A — Designer procures, Client reimburses',
		body: `8.1. **Option A — Designer procures, Client reimburses.** Designer purchases needed services and lists them on an itemized final invoice, in addition to the quoted project fee. A handling fee of {{handling_pct}}% applies to pass-through costs. Any single item over {{per_item_threshold_formatted}} requires Client's prior written approval.`
	},
	{
		docType: 'agreement',
		clauseType: 'module',
		moduleKey: 'third_party_b',
		sortOrder: 82,
		sectionNumber: '8.2',
		title: 'Option B — Client provides a controlled payment method',
		body: `8.2. **Option B — Client provides a controlled payment method.** Client supplies a payment method for project purchases; every purchase is pre-approved in writing before it's made. To keep this safe for both sides, Client is encouraged to issue a virtual card (e.g., via Privacy.com) that is merchant-locked and spend-limited — so the card only works at the intended vendor, up to a set cap, and can be paused or closed anytime. Issue one locked card per vendor.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 90,
		sectionNumber: '9',
		title: 'Intellectual Property & Ownership',
		body: `9.1. **Transfer on full payment.** Upon receipt of payment in full, Designer assigns to Client the ownership of the final deliverables created specifically for Client under this Agreement. Until payment in full, Designer retains all rights, and Client has no license to use the work.

9.2. **Pre-existing & background IP.** Designer's pre-existing and independently developed materials—including but not limited to design systems, code libraries, components, custom CMS, frameworks and methodologies (including Designer's proprietary MX / Machine Experience framework), templates, and reusable tooling—remain Designer's exclusive property.
Client receives a perpetual, non-exclusive, non-transferable license to use these materials solely as incorporated into the deliverables.

9.3. **Third-Party Assets.** Fonts, stock, plugins, and other licensed third-party materials are governed by their own licenses; Client is responsible for maintaining any required licenses after handoff.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 100,
		sectionNumber: '10',
		title: 'Portfolio & Promotion',
		body: `10.1. **Designer's default rights.** Designer may display, reproduce, and describe the work—including process, drafts, and final deliverables—in Designer's portfolio and marketing materials, and may publicly identify Designer as the creator, for the purpose of promoting Designer's services and attracting new clients. This right survives completion and is not transferred by Section 9.

10.2. **Confidentiality / Attribution-Waiver Addendum.** If Client wants Designer to (a) keep the engagement confidential and/or (b) refrain from publicly claiming authorship (allowing Client to present the work as its own), the Parties will sign the separate Confidentiality & Attribution Addendum, and Client will pay the associated premium of {{addendum_premium_label}}. Without a signed addendum, Section 10.1 governs.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 110,
		sectionNumber: '11',
		title: 'Confidentiality',
		body: `11.1. Each Party will protect the other's non-public information and use it only for the project. This mutual duty does not, by itself, restrict Designer's portfolio rights under Section 10.1—those are limited only by an executed Section 10.2 addendum.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 120,
		sectionNumber: '12',
		title: 'Client Materials & Warranties',
		body: `12.1. Client warrants that any content it provides (text, images, logos, fonts, data) is owned or properly licensed by Client, and that Designer's use of it as directed won't infringe anyone's rights.

12.2. Client will defend and indemnify Designer against claims arising from Client-supplied materials or from Client's use of the deliverables after handoff.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 130,
		sectionNumber: '13',
		title: 'Warranty & Post-Launch Support',
		body: `13.1. Designer will correct defects in Designer's own work reported within {{warranty_days}} days of final delivery, at no charge.

13.2. This does not cover changes Client (or third parties) make after handoff, new features, content updates, or breakage caused by third-party services, hosts, plugins, or platform updates. Support beyond the warranty window is billed hourly or via a separate maintenance agreement.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 140,
		sectionNumber: '14',
		title: 'Independent Contractor',
		body: `14.1. Designer is an independent contractor, not an employee, partner, or agent of Client. Designer controls the means and methods of the work, supplies own tools, and is responsible for own taxes and insurance.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 150,
		sectionNumber: '15',
		title: 'Limitation of Liability',
		body: `15.1. To the maximum extent permitted by law, Designer's total liability under this Agreement is limited to the total fees paid by Client for the project. Designer is not liable for indirect, incidental, or consequential damages (including lost profits or data), even if advised of the possibility.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 160,
		sectionNumber: '16',
		title: 'Third-Party Services Disclaimer',
		body: `16.1. Designer is not responsible for the performance, availability, pricing changes, or discontinuation of third-party services (hosts, platforms, APIs, plugins), or for outages or breaches on those services.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 170,
		sectionNumber: '17',
		title: 'Force Majeure',
		body: `17.1. Neither Party is liable for delays or failures caused by events beyond reasonable control (natural disasters, illness, outages, acts of government). Timelines extend for the duration of the event.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 180,
		sectionNumber: '18',
		title: 'Dispute Resolution & Governing Law',
		body: `18.1. **Governing law:** This Agreement is governed by the laws of the State of {{governing_state}}, without regard to conflict-of-laws rules.

18.2. **Good faith first.** The Parties will first attempt to resolve any dispute directly, then through mediation, before litigation.

18.3. **Venue / small claims:** Unresolved disputes may be brought in the state courts located in {{venue_county}}, {{governing_state}}. Smaller claims may be pursued in the appropriate limited-jurisdiction (magistrate) court up to that court's statutory limit.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 190,
		sectionNumber: '19',
		title: 'General',
		body: `19.1. **Entire agreement.** This Agreement plus Exhibit A (and any signed Modules/Addenda) is the complete agreement and supersedes prior discussions.

19.2. Amendments must be in writing and signed by both Parties.

19.3. **Severability.** If any provision is held invalid, the rest remains in effect.

19.4. **Waiver.** Not enforcing a term once doesn't waive it later.

19.5. **Assignment.** Neither Party may assign this Agreement without the other's written consent. The only exception would be if the Designer uses subcontractors (while remaining responsible for the work).

19.6. Electronic signatures are valid and binding.`
	},
	{
		docType: 'agreement',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 200,
		sectionNumber: 'S',
		title: 'Signatures',
		body: `Designer: ______________________________  Date: __________
{{designer_short}}

Client: ________________________________  Date: __________
{{contact_name}}, {{legal_name}}`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 300,
		sectionNumber: 'A0',
		title: 'Exhibit A — Statement of Work',
		body: `Attaches to and is governed by the Design & Development Services Agreement (the "Agreement") between {{designer_short}} and {{legal_name}}. Capitalized terms have the meanings given in the Agreement.

Project name: {{project_name}}
Date: {{effective_date}}
Primary Client contact (approvals authority): {{contact_name}} / {{contact_email}} / {{contact_phone}}`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 310,
		sectionNumber: 'A1',
		title: 'Project description',
		body: `{{project_description}}`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 320,
		sectionNumber: 'A2',
		title: 'Deliverables',
		body: `{{deliverables_table}}

A "round" = one consolidated set of feedback (Agreement §1.3). Extra rounds bill at {{overage_rate_formatted}}/hour.`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 330,
		sectionNumber: 'A3',
		title: 'Out of scope',
		body: `{{out_of_scope_list}}`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 340,
		sectionNumber: 'A4',
		title: 'Timeline & milestones',
		body: `{{milestones_table}}`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 350,
		sectionNumber: 'A5',
		title: 'Approval stages',
		body: `Written sign-off (email OK) is required at: {{approval_stages_list}}. A deliverable is accepted on written approval or after {{acceptance_window_days}} business days without written revisions (§5.2).`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 360,
		sectionNumber: 'A6',
		title: 'Fees',
		body: `Base project fee (flat, to spec): {{base_fee_formatted}}
Confidentiality/Attribution premium (if Module 10.2): {{confidentiality_premium_formatted}}
Total project fee: {{total_formatted}}
{{deposit_pct}}% deposit (due before work begins, §3.2): {{deposit_formatted}}
Remaining {{remaining_pct}}%: {{remaining_formatted}}

Payment split for the remaining {{remaining_pct}}%: {{remaining_structure_label}}
Overage rate: {{overage_rate_formatted}}/hour (revisions beyond included rounds, out-of-scope work, post-warranty support).
Final-invoice terms: due within {{invoice_due_days}} days; late fee ({{late_fee_pct}}%/mo) after day {{late_fee_grace_days}}; collections eligible after day {{collections_days}} (§3.6–3.7).`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 370,
		sectionNumber: 'A7',
		title: 'Third-party costs (§8)',
		body: `Option: {{third_party_option_label}}

Account ownership & renewals:
{{service_ownership_table}}`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 380,
		sectionNumber: 'A8',
		title: 'Modules enabled',
		body: `- {{pg_mark}} §3.8 Personal Guarantee
- {{conf_mark}} §10.2 Confidentiality / Attribution Addendum — Tier: {{confidentiality_tier_label}} — Premium: {{confidentiality_premium_formatted}}`
	},
	{
		docType: 'sow',
		clauseType: 'core',
		moduleKey: null,
		sortOrder: 390,
		sectionNumber: 'AS',
		title: 'Agreed',
		body: `Agreed — Designer: __________________________  Date: ______
{{designer_short}}

Agreed — Client: ____________________________  Date: ______
{{contact_name}}, {{legal_name}}`
	},
	{
		docType: 'addendum',
		clauseType: 'module',
		moduleKey: 'confidentiality',
		sortOrder: 400,
		sectionNumber: 'C0',
		title: 'Confidentiality & Attribution Addendum',
		body: `Addendum to the Design & Development Services Agreement (the "Agreement") — enables Module 10.2

Effective date: {{effective_date}}
Designer: {{designer_name}}
Client: {{legal_name}}
Project: {{project_name}}

This Addendum modifies Section 10 (Portfolio & Promotion) of the Agreement and adds the confidentiality obligations below. In exchange, Client pays the premium selected in Section 3. All other terms of the Agreement remain in full effect. Where this Addendum conflicts with Section 10 or 11 of the Agreement, this Addendum controls.

Why this costs extra (plain-language recital): Designer's standard pricing assumes the right to use completed work to attract future clients (Section 10.1). When Client removes that right, the project loses value Designer would otherwise recover through portfolio, case studies, and referrals. The premium below compensates for that lost value.`
	},
	{
		docType: 'addendum',
		clauseType: 'module',
		moduleKey: 'confidentiality',
		sortOrder: 410,
		sectionNumber: 'C1',
		title: 'Select ONE tier',
		body: `Client selects one of the following. The selected tier and its premium are recorded in Exhibit A.

Floor pricing: the confidentiality tiers are priced as the greater of a percentage or a flat floor. The value Designer loses isn't proportional to the fee — a small but excellent project can be worth more to Designer's referral funnel than a large forgettable one.

{{tier_1_mark}} Tier 1 — Attribution Waiver (White-Label) · Premium: 10% of project fee

- The deliverables may be public or live, but Designer will not publicly claim authorship of the work or publicly identify Client as a client.
- Client may present the deliverables as its own (e.g., as in-house work).
- Designer retains the right to reference the work privately — one-to-one with prospective clients under a confidentiality obligation, and in a non-public/private portfolio — but waives all public portfolio and marketing use.
- What Designer gives up: public credit and public lead-generation. What Designer keeps: limited private reuse.

{{tier_2_mark}} Tier 2 — Confidentiality · Premium: the greater of 20% of project fee or {{premium_floor_formatted}}

- Designer will not display, reproduce, describe, or reference the engagement or the deliverables in any portfolio or marketing — public or private — and will not disclose the existence of the engagement, except as permitted in Section 2.
- Authorship is not affirmatively waived, but because Designer may not show or discuss the work, there is effectively no public credit.
- What Designer gives up: all portfolio, case-study, and marketing value from the project.
- Flagship note: for standout work that would have anchored the portfolio, Designer may quote 25–30% case-by-case — the premium tracks how good the work is, not just the invoice size.

{{tier_3_mark}} Tier 3 — Both (Full Confidentiality + Attribution Waiver) · Premium: the greater of 30% of project fee or {{premium_floor_formatted}}

- All obligations of Tier 2, plus a permanent attribution waiver: Client may present the deliverables as its own indefinitely, including if the work later becomes publicly known.
- Maximum restriction — full confidentiality (20%) stacked with the permanent attribution waiver (10%). This is the one tier where both levers combine; priced as the sum, since full lockdown is the most valuable thing you can give away.

Selected for this project: Tier {{confidentiality_tier}} ({{confidentiality_tier_label}}) — {{premium_pct}}% = {{confidentiality_premium_formatted}}.`
	},
	{
		docType: 'addendum',
		clauseType: 'module',
		moduleKey: 'confidentiality',
		sortOrder: 420,
		sectionNumber: 'C2',
		title: 'Confidentiality terms (apply to Tiers 2 and 3)',
		body: `2.1. Confidential Information means the existence and details of the engagement and the deliverables, and any non-public information exchanged for the project.

2.2. Standard carve-outs. Obligations do not apply to information that: (a) is or becomes public through no fault of Designer; (b) Designer already lawfully knew; (c) Designer independently developed without using Confidential Information; or (d) must be disclosed by law or court order (Designer will give Client reasonable advance notice where legally permitted).

2.3. Pre-existing & background IP unaffected. Nothing here restricts Designer's ownership or reuse of the pre-existing and background IP described in Section 9.2 of the Agreement (including Designer's reusable systems, components, and the MX / Machine Experience framework). Confidentiality covers Client's project — not Designer's toolkit.

2.4. Duration. Confidentiality obligations remain in effect for {{confidentiality_duration}} from final delivery. The attribution waiver in Tiers 1 and 3 is permanent.`
	},
	{
		docType: 'addendum',
		clauseType: 'module',
		moduleKey: 'confidentiality',
		sortOrder: 430,
		sectionNumber: 'C3',
		title: 'Premium & payment',
		body: `3.1. The selected premium is added to the total project fee and reflected in Exhibit A.

3.2. The premium is billed with the deposit or per the milestone schedule in Exhibit A and is non-refundable, since the restriction attaches the moment work begins.

3.3. If no tier is selected or this Addendum is unsigned, Section 10.1 of the Agreement governs and Designer retains full portfolio and promotional rights.`
	},
	{
		docType: 'addendum',
		clauseType: 'module',
		moduleKey: 'confidentiality',
		sortOrder: 440,
		sectionNumber: 'C4',
		title: 'Remedies',
		body: `4.1. The Parties agree that a breach of the confidentiality obligations in Tiers 2–3 may cause harm that is difficult to quantify, and that injunctive relief (in addition to any other remedy) is appropriate. All dispute-resolution and governing-law terms of the Agreement (Section 18) apply.`
	},
	{
		docType: 'addendum',
		clauseType: 'module',
		moduleKey: 'confidentiality',
		sortOrder: 450,
		sectionNumber: 'CS',
		title: 'Signatures',
		body: `Designer: ______________________________  Date: __________
{{designer_short}}

Client: ________________________________  Date: __________
{{contact_name}}, {{legal_name}}

Selected tier: {{confidentiality_tier}} ({{confidentiality_tier_label}}) — Premium: {{premium_pct}}% = {{confidentiality_premium_formatted}}`
	}
];
