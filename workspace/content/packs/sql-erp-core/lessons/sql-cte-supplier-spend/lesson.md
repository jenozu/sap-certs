# Supplier spend with a CTE

**Why it matters:** Finance ranks suppliers by total ordered value.

Using a CTE, return supplier **name** and **total_spend** (sum of qty_ordered × unit_cost over their PO lines) for suppliers with POs. Sort by total_spend descending.

Tables are described in the schema panel. Dialect: SQLite.
