# Stock below reorder point, by warehouse

**Why it matters:** Replenishment planners start with the count of low-stock items per warehouse.

Use a CTE `low` for inventory rows with on_hand below reorder_point, then return warehouse **code** and **low_items** for warehouses with at least one. Sort by code.

Tables are described in the schema panel. Dialect: SQLite.
