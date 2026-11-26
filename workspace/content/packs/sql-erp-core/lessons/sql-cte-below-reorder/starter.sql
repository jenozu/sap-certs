WITH low AS (
  SELECT * FROM inventory WHERE on_hand < reorder_point
)
SELECT w.code
FROM warehouses w
