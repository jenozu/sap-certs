# One list of stock movements

**Why it matters:** Inventory control wants receipts (in) and sales lines (out) in one movement list, keeping every movement.

Return **product_id**, **qty** and **direction** ('IN' for receipt lines, 'OUT' for sales order lines). Receipt lines: join to po_lines on (po_id, line_no) for product_id. Keep duplicates.

Tables are described in the schema panel. Dialect: SQLite.
