# Model Card Payments as Account transfers

A Card Payment is a same-currency transfer from a Funding Account to its credit-card Account. It consumes the Card Payment Reserve, then funded Opening Card Debt, then Unassigned Money against unfunded debt; any amount beyond the total liability becomes Card Credit and returns to Unassigned Money. Modeling payment as an expense would count the purchase twice, while adjusting only the reserve would leave the ledger and budget disagreeing.
