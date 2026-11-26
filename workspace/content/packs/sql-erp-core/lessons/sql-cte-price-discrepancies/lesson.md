# Invoice price discrepancies

**Why it matters:** Accounts payable holds invoices whose unit cost differs from the PO.

With a CTE that pairs invoice lines with PO lines, return **invoice_id**, **po_id**, **line_no**, **po_cost**, **invoiced_cost** and **difference** (invoiced minus PO) where they differ.

Tables are described in the schema panel. Dialect: SQLite.
