SELECT pl.product_id, rl.qty_received AS qty, 'IN' AS direction
FROM receipt_lines rl
JOIN po_lines pl ON pl.po_id = rl.po_id AND pl.line_no = rl.line_no
