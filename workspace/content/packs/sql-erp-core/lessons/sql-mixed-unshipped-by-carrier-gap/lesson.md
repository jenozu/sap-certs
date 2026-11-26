# Orders with no shipment or no ship date

**Why it matters:** Customer service follows up on orders that have not physically left.

Return **so_id** and **reason**: 'No shipment' for orders without a shipment row, and 'Not shipped yet' for shipments with no shipped_date. Combine with UNION ALL. Sort by so_id.

Tables are described in the schema panel. Dialect: SQLite.
