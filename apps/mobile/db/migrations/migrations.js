// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from "./meta/_journal.json";
import m0000 from "./0000_true_leper_queen.sql";
import m0001 from "./0001_add_recurring_transaction_flag.sql";
import m0002 from "./0002_recurring_frequency_model.sql";
import m0003 from "./0003_add_owner_user_id.sql";
import m0004 from "./0004_outbox_sync.sql";

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
  },
};
