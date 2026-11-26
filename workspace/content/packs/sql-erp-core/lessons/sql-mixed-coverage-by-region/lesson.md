# Category coverage by region

**Why it matters:** Find which product categories have zero stock anywhere in each region.

Return **region** and **category** pairs where total on_hand across that region's warehouses for that category is 0 or no stock rows exist. Use a CTE for stock per region and category, and CROSS JOIN for all pairs. Sort by region, category.

Tables are described in the schema panel. Dialect: SQLite.
