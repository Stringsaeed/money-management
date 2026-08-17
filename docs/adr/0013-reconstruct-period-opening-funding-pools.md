# Reconstruct Period-opening Funding Pools

When budgeting starts or Funding Membership changes during a Budget Period, the app reconstructs each Funding Account's balance at the period boundary and replays current-period activity exactly once. Starting from today's balance would either ignore earlier activity or double-count it when the accepted current-month budget is calculated.
