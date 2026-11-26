WITH received AS (
  SELECT po_id, line_no, SUM(qty_received) AS qty
  FROM receipt_lines
  GROUP BY po_id, line_no
)
SELECT l.po_id, l.line_no
FROM po_lines l
