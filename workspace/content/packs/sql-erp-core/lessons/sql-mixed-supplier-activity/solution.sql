WITH counts AS (
  SELECT supplier_id, COUNT(*) AS po_count FROM purchase_orders GROUP BY supplier_id
)
SELECT s.name, COALESCE(c.po_count, 0) AS po_count,
       CASE WHEN c.po_count IS NULL THEN 'Inactive' ELSE 'Active' END AS activity
FROM suppliers s
LEFT JOIN counts c ON c.supplier_id = s.supplier_id;
