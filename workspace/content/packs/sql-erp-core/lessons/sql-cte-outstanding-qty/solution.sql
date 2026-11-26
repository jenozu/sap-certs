WITH received AS (
  SELECT po_id, line_no, SUM(qty_received) AS qty
  FROM receipt_lines
  GROUP BY po_id, line_no
)
SELECT l.po_id, l.line_no, l.qty_ordered - COALESCE(r.qty, 0) AS outstanding
FROM po_lines l
LEFT JOIN received r ON r.po_id = l.po_id AND r.line_no = l.line_no
WHERE l.qty_ordered - COALESCE(r.qty, 0) > 0
ORDER BY l.po_id, l.line_no;
