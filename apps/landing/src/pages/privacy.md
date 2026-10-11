---
layout: ../layouts/Legal.astro
title: Privacy policy
description: What Trove collects, why, who processes it, and how to get it deleted.
eyebrow: LEGAL · PRIVACY
effective: 2026-10-11
---

<p class="lede">Trove is a money app. You type in your accounts, spending and plans, so the data is personal by nature. This policy says plainly what we keep, what leaves our servers, and how to get it removed.</p>

Trove is run by Muhammed Ibrahim ("we", "us"). This policy covers the Trove mobile app, the Trove servers it talks to, and this website, trove.ing. Write to [privacy@trove.ing](mailto:privacy@trove.ing) with any question or request.

## What we collect

### Your ledger

Everything you enter is stored on our servers so the app can show it to you on any device you sign in on:

- accounts (name, type, currency, opening balance), categories, and transactions, including their amounts, dates and any note you write;
- recurring rules and their schedule;
- budgets: paydays, envelopes, plans, and what you set aside;
- households you create or join, and their members.

Trove does not connect to your bank today. Nothing reaches your ledger unless you add it. If we add optional bank connections, we will update this policy before they launch.

### Your account

- **Guest mode.** You can use Trove without signing up. We create a private guest session and store a one-way hash of its token, never the token itself. To slow down abuse, we also store a one-way hash of your network address, used only to rate-limit new guest sessions.
- **Signing in.** Sign-in is handled by our identity provider, WorkOS. We receive and store your WorkOS user ID, email address and name. We never see a password.

### On your device

Your session, your settings (smart categories, anonymous usage, sounds) and your bill and payday reminders are kept on your phone in its secure storage. Reminders are scheduled locally by your phone. We do not send push notifications and do not collect a push token.

### Anonymous usage (optional)

With **Share anonymous usage** on, the app sends product events such as "budget set up" or "bill marked paid" to PostHog, our analytics provider. Events carry counts and yes/no flags only. They never include amounts, payees, notes or account names. They are tied to a random device ID, not to your name or email. PostHog also receives the app version, device type, operating system, language and time zone.

This setting is on by default. You can turn it off any time in Profile. The app still asks PostHog which features are switched on for it, such as budgeting, even when sharing is off. That request sends no usage events.

We do not use session recording or crash-reporting tools.

### This website

trove.ing sets no cookies and runs no analytics or advertising scripts. Cloudflare, which serves the site, reads the country of each request so the page can show your local currency. We do not store it.

## How we use it

We use your information to:

- run Trove and show you your ledger, budget and household;
- keep your account and guest session secure, and prevent abuse;
- suggest categories, if smart categories is on;
- understand which features help, through anonymous usage, if you leave it on;
- answer you when you write to us.

We do not sell your data. We do not show ads, and we do not use your ledger to profile you for anyone else.

Where the law asks for a legal basis, we rely on running the service you asked for, on our legitimate interest in keeping Trove secure and improving it, and on your choice for optional features you can switch off.

## Smart categories

When you save a transaction with a note, smart categories can pick its category for you. To do that, our server sends **the note, whether it is income or spending, its currency, and your category names** to AI models through the Vercel AI Gateway. The models are TypeSafe AI's Jev and, when Jev is unsure, Anthropic's Claude.

Claude may run a web search, through Perplexity, to recognise an unfamiliar name in the note. We never send amounts, balances, other transactions, accounts, or your identity.

We ask these providers not to train on this data, and ask Anthropic to keep none of it. Notes are free text, so leave out anything you would not want processed this way.

Smart categories is on by default. Turn it off any time in Profile, and the app stops sending notes.

## Who processes your data

We use these providers to run Trove. Each receives only what its job needs.

- **Cloudflare** hosts our servers and this website, and keeps short-lived request logs that can include your network address.
- **PlanetScale** hosts our database.
- **WorkOS** handles sign-in and sends household invitations by email.
- **PostHog** receives anonymous usage, if you leave it on, and serves feature switches.
- **Vercel AI Gateway, TypeSafe AI, Anthropic and Perplexity** process the data described under Smart categories, if it is on.

Market quotes come from Twelve Data, Metals.dev and FreeCryptoAPI. Our server fetches the same public prices for everyone, and no information about you is sent to them.

We may disclose information if the law requires it, or to protect the safety of our users or the public.

## Households

When you join a household, its members can see your name and email address and everything in the household ledger, including who added each entry. Your personal ledger stays private to you. Leaving a household removes your access to its ledger.

## Where your data lives

Our servers and database run in the United States (Cloudflare, and PlanetScale on AWS in us-east-1). PostHog's servers are also in the United States. If you use Trove from elsewhere, your data is transferred there. Our providers protect data in transit and at rest; Trove does not add end-to-end encryption on top.

## How long we keep it

- **Your ledger and account** are kept while your account exists. Things you delete in the app, such as a transaction, an account or a category, are removed from our database.
- **Guest sessions** last 30 days. When one ends or expires, its ledger can no longer be reached from the app. We do not yet remove that data automatically; write to us and we will delete it.
- **Smart-category usage counters** are deleted within a day or two.
- **Request logs** are kept by Cloudflare for a limited period.

## Your choices and rights

- Turn smart categories and anonymous usage on or off in Profile.
- Edit or delete any account, category or transaction in the app.
- Ask us at [privacy@trove.ing](mailto:privacy@trove.ing) for a copy of your data, to correct it, or to delete your account and everything in it. We will act within 30 days. Deleting an account can't be undone.

Depending on where you live, laws such as the UAE Personal Data Protection Law or the EU General Data Protection Regulation give you these rights and others, including the right to object to some uses and to complain to your local data protection authority.

## Children

Trove is not meant for anyone under 18, and we do not knowingly collect data from children. If you believe a child has given us information, write to us and we will delete it.

## Open source

Trove's code is public under the MIT License, so anyone can check how the app handles data. This policy covers the service we run. If you run your own copy of Trove, you are responsible for how it handles data.

## Changes

We will post any change on this page and update the date at the top. If a change materially affects how we use data we already hold, we will tell you in the app before it takes effect.

## Contact

Muhammed Ibrahim · [privacy@trove.ing](mailto:privacy@trove.ing)
