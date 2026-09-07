DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'powersync_role') THEN
    GRANT SELECT ON TABLE
      public.budget_workspaces,
      public.envelopes,
      public.category_mappings,
      public.funding_memberships,
      public.rollover_settings,
      public.assignments,
      public.refund_links,
      public.recurring_rules,
      public.recurring_occurrences
    TO powersync_role;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
    ALTER PUBLICATION powersync SET TABLE
      public.membership,
      public.accounts,
      public.categories,
      public.transactions,
      public.budget_workspaces,
      public.envelopes,
      public.category_mappings,
      public.funding_memberships,
      public.rollover_settings,
      public.assignments,
      public.refund_links,
      public.recurring_rules,
      public.recurring_occurrences;
  END IF;
END $$;
