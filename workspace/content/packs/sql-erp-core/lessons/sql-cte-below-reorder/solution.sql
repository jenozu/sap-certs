WITH low AS (
  SELECT * FROM inventory WHERE on_hand < reorder_point
)
SELECT w.code, COUNT(*) AS low_items
FROM low
JOIN warehouses w ON w.warehouse_id = low.warehouse_id
GROUP BY w.warehouse_id, w.code
ORDER BY w.code;
