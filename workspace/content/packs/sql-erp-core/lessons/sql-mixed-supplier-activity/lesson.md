# Supplier activity summary

**Why it matters:** Vendor management reviews suppliers by PO count, including inactive ones.

Return supplier **name**, **po_count** (0 if none) and **activity** ('Inactive' when po_count = 0, else 'Active'). Use a CTE for PO counts.

Tables are described in the schema panel. Dialect: SQLite.
