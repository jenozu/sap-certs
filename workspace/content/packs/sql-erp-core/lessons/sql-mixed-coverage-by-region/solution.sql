WITH stock AS (
  SELECT w.region, p.category, SUM(i.on_hand) AS qty
  FROM inventory i
  JOIN warehouses w ON w.warehouse_id = i.warehouse_id
  JOIN products p ON p.product_id = i.product_id
  GROUP BY w.region, p.category
)
SELECT r.region, c.category
FROM (SELECT DISTINCT region FROM warehouses) r
CROSS JOIN (SELECT DISTINCT category FROM products) c
LEFT JOIN stock s ON s.region = r.region AND s.category = c.category
WHERE COALESCE(s.qty, 0) = 0
ORDER BY r.region, c.category;
