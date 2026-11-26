# Outstanding quantity per PO line

**Why it matters:** Receiving needs remaining quantities, including partially received lines.

Using a CTE for received totals, return **po_id**, **line_no** and **outstanding** (qty_ordered minus total received, treating none as 0) for lines still outstanding (> 0). Sort by po_id, line_no.

Tables are described in the schema panel. Dialect: SQLite.
