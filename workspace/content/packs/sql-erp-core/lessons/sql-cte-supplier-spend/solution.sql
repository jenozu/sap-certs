WITH po_value AS (
  SELECT po.supplier_id, SUM(l.qty_ordered * l.unit_cost) AS total_spend
  FROM purchase_orders po
  JOIN po_lines l ON l.po_id = po.po_id
  GROUP BY po.supplier_id
)
SELECT s.name, v.total_spend
FROM po_value v
JOIN suppliers s ON s.supplier_id = v.supplier_id
ORDER BY v.total_spend DESC;
