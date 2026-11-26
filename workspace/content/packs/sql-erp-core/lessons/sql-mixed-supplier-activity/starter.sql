WITH counts AS (
  SELECT supplier_id, COUNT(*) AS po_count FROM purchase_orders GROUP BY supplier_id
)
SELECT s.name
FROM suppliers s
