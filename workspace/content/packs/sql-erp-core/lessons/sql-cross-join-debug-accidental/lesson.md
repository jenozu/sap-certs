# Debug: the accidental CROSS JOIN

**Why it matters:** An order report returns far too many rows: a join condition is missing.

Fix the query so it returns each sales order's **so_id** and the customer **name** (one row per order).

Tables are described in the schema panel. Dialect: SQLite.
