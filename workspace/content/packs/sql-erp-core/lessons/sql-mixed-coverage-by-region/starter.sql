WITH stock AS (
  SELECT w.region, p.category, SUM(i.on_hand) AS qty
  FROM inventory i
  JOIN warehouses w ON w.warehouse_id = i.warehouse_id
  JOIN products p ON p.product_id = i.product_id
  GROUP BY w.region, p.category
)
SELECT r.region, c.category
FROM (SELECT DISTINCT region FROM warehouses) r
