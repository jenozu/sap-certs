WITH paired AS (
  SELECT i.invoice_id, i.po_id, i.line_no, l.unit_cost AS po_cost, i.invoiced_unit_cost AS invoiced_cost
  FROM supplier_invoices i
  JOIN po_lines l ON l.po_id = i.po_id AND l.line_no = i.line_no
)
SELECT * FROM paired;
