# Two CTEs: top customers by revenue

**Why it matters:** Sales leadership wants customers whose revenue is above the average customer revenue.

Use one CTE for revenue per customer (sum of qty × unit_price) and a second for the average of those revenues. Return **name** and **revenue** for customers above average, highest first.

Tables are described in the schema panel. Dialect: SQLite.
