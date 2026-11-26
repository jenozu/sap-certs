# Debug: the LEFT JOIN that lost rows

**Why it matters:** A report should list every warehouse with its count of open sales orders, but warehouses with none disappear.

Fix the query so **every warehouse code** appears with **open_orders** (0 when none are open).

Tables are described in the schema panel. Dialect: SQLite.
