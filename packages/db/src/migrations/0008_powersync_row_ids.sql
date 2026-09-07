DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.accounts'::regclass
      AND conname = 'accounts_household_id_id_unique'
  ) THEN
    ALTER TABLE "accounts"
      ADD CONSTRAINT "accounts_household_id_id_unique" UNIQUE("household_id", "id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.categories'::regclass
      AND conname = 'categories_household_id_id_unique'
  ) THEN
    ALTER TABLE "categories"
      ADD CONSTRAINT "categories_household_id_id_unique" UNIQUE("household_id", "id");
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_household_id_account_id_accounts_household_id_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_household_id_to_account_id_accounts_household_id_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_household_id_category_id_categories_household_id_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_household_id_id_pk";
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_household_id_id_pk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_household_id_id_pk";
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.accounts'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE "accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.categories'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY("id");
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND conname = 'transactions_household_id_account_id_accounts_household_id_id_fk'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_household_id_account_id_accounts_household_id_id_fk"
      FOREIGN KEY ("household_id", "account_id")
      REFERENCES "public"."accounts"("household_id", "id")
      ON DELETE no action ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND conname = 'transactions_household_id_to_account_id_accounts_household_id_id_fk'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_household_id_to_account_id_accounts_household_id_id_fk"
      FOREIGN KEY ("household_id", "to_account_id")
      REFERENCES "public"."accounts"("household_id", "id")
      ON DELETE set null ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND conname = 'transactions_household_id_category_id_categories_household_id_id_fk'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_household_id_category_id_categories_household_id_id_fk"
      FOREIGN KEY ("household_id", "category_id")
      REFERENCES "public"."categories"("household_id", "id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
