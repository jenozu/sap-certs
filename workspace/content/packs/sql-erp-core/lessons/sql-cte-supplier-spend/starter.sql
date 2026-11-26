WITH po_value AS (
  -- total per supplier
)
SELECT s.name, v.total_spend
FROM po_value v
JOIN suppliers s ON s.supplier_id = v.supplier_id
ORDER BY v.total_spend DESC;
