# Recalculate budgets after ledger corrections

Editing or deleting a past Transaction recalculates its Budget Period and every later Rollover, with the result exposed as a Historical Adjustment. Locking completed periods would leave the budget disagreeing with the corrected ledger, while posting every correction only in the current month would obscure which historical plan actually changed.
