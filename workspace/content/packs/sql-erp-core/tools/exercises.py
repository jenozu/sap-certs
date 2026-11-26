# Source of truth for sql-erp-core exercises. `python3 tools/build_pack.py` writes the pack files.
# Each: id, title, skills, difficulty, kind, purpose, task (Markdown), starter, solution, hints, constructs, order.
E = []
def ex(**k): E.append(k)

# ---------- LEFT JOIN (5) ----------
ex(id="sql.left-join.customers-without-orders", title="Customers who have never ordered", skills=["sql-left-join"], difficulty="intro", kind="targeted",
   purpose="Sales wants to re-engage accounts that have never placed an order.",
   task="List the **name** and **city** of every customer with no sales orders. Sort by name.",
   starter="SELECT c.name, c.city\nFROM customers c\n-- join sales_orders here\n",
   solution="SELECT c.name, c.city\nFROM customers c\nLEFT JOIN sales_orders s ON s.customer_id = c.customer_id\nWHERE s.so_id IS NULL\nORDER BY c.name;",
   hints=["Keep every customer, even without a matching order: that's a LEFT JOIN from customers.", "After the join, customers with no order have NULL in every sales_orders column. Filter on `s.so_id IS NULL`."],
   constructs=["LEFT JOIN"], order=True)
ex(id="sql.left-join.unsold-products", title="Products that have never sold", skills=["sql-left-join"], difficulty="intro", kind="targeted",
   purpose="Purchasing reviews dead stock before the next reorder run.",
   task="Show the **sku** and **description** of products that appear on no sales order line.",
   starter="SELECT p.sku, p.description\nFROM products p\n",
   solution="SELECT p.sku, p.description\nFROM products p\nLEFT JOIN so_lines l ON l.product_id = p.product_id\nWHERE l.so_id IS NULL;",
   hints=["Start from products so none are lost.", "LEFT JOIN so_lines and keep only rows where the so_lines side is NULL."],
   constructs=["LEFT JOIN"], order=False)
ex(id="sql.left-join.outstanding-pos", title="Purchase orders with no receipt yet", skills=["sql-left-join"], difficulty="core", kind="business",
   purpose="The receiving team chases suppliers for POs that have not arrived.",
   task="List **po_id**, the supplier **name** and **order_date** for purchase orders that have no receipt. Sort by po_id.",
   starter="SELECT po.po_id, s.name, po.order_date\nFROM purchase_orders po\nJOIN suppliers s ON s.supplier_id = po.supplier_id\n",
   solution="SELECT po.po_id, s.name, po.order_date\nFROM purchase_orders po\nJOIN suppliers s ON s.supplier_id = po.supplier_id\nLEFT JOIN receipts r ON r.po_id = po.po_id\nWHERE r.receipt_id IS NULL\nORDER BY po.po_id;",
   hints=["The supplier name needs an INNER join; the missing receipt needs a LEFT join.", "Filter `r.receipt_id IS NULL`."],
   constructs=["LEFT JOIN"], order=True)
ex(id="sql.left-join.order-count-per-customer", title="Order count per customer, including zero", skills=["sql-left-join", "sql-aggregates"], difficulty="core", kind="targeted",
   purpose="Account managers want every customer listed with how many orders they placed, even none.",
   task="Return each customer's **name** and **order_count** (number of sales orders, 0 if none).",
   starter="SELECT c.name, COUNT(*) AS order_count\nFROM customers c\nLEFT JOIN sales_orders s ON s.customer_id = c.customer_id\nGROUP BY c.customer_id, c.name;",
   solution="SELECT c.name, COUNT(s.so_id) AS order_count\nFROM customers c\nLEFT JOIN sales_orders s ON s.customer_id = c.customer_id\nGROUP BY c.customer_id, c.name;",
   hints=["Run the starter: customers with no orders show 1, not 0. Why?", "COUNT(*) counts the row created by the LEFT JOIN. Count a column from the right-hand table instead: COUNT(s.so_id)."],
   constructs=["LEFT JOIN"], order=False)
ex(id="sql.left-join.debug-filter-in-where", title="Debug: the LEFT JOIN that lost rows", skills=["sql-left-join"], difficulty="stretch", kind="debugging",
   purpose="A report should list every warehouse with its count of open sales orders, but warehouses with none disappear.",
   task="Fix the query so **every warehouse code** appears with **open_orders** (0 when none are open).",
   starter="SELECT w.code, COUNT(s.so_id) AS open_orders\nFROM warehouses w\nLEFT JOIN sales_orders s ON s.warehouse_id = w.warehouse_id\nWHERE s.status = 'Open'\nGROUP BY w.warehouse_id, w.code;",
   solution="SELECT w.code, COUNT(s.so_id) AS open_orders\nFROM warehouses w\nLEFT JOIN sales_orders s ON s.warehouse_id = w.warehouse_id AND s.status = 'Open'\nGROUP BY w.warehouse_id, w.code;",
   hints=["A WHERE condition on the right-hand table removes the NULL rows the LEFT JOIN created.", "Move the status condition into the ON clause."],
   constructs=["LEFT JOIN"], order=False)

# ---------- CROSS JOIN (5) ----------
ex(id="sql.cross-join.warehouse-category-matrix", title="Warehouse × category planning grid", skills=["sql-cross-join"], difficulty="intro", kind="targeted",
   purpose="Planning wants an empty grid of every warehouse and product category to fill in targets.",
   task="Return every combination of warehouse **code** and distinct product **category**. Sort by code, then category.",
   starter="SELECT w.code, c.category\nFROM warehouses w\n-- combine with the distinct categories\n",
   solution="SELECT w.code, c.category\nFROM warehouses w\nCROSS JOIN (SELECT DISTINCT category FROM products) c\nORDER BY w.code, c.category;",
   hints=["A CROSS JOIN pairs every row on the left with every row on the right.", "Use a subquery `SELECT DISTINCT category FROM products` as the right side."],
   constructs=["CROSS JOIN"], order=True)
ex(id="sql.cross-join.missing-stock-records", title="Find missing inventory records", skills=["sql-cross-join", "sql-left-join"], difficulty="core", kind="business",
   purpose="Every product should have an inventory row in every warehouse; missing rows break replenishment.",
   task="List warehouse **code** and product **sku** for every warehouse/product pair that has **no** inventory row.",
   starter="SELECT w.code, p.sku\nFROM warehouses w\nCROSS JOIN products p\n",
   solution="SELECT w.code, p.sku\nFROM warehouses w\nCROSS JOIN products p\nLEFT JOIN inventory i ON i.warehouse_id = w.warehouse_id AND i.product_id = p.product_id\nWHERE i.product_id IS NULL;",
   hints=["The CROSS JOIN gives every pair that *should* exist.", "LEFT JOIN inventory on both keys and keep the NULL matches."],
   constructs=["CROSS JOIN"], order=False)
ex(id="sql.cross-join.count-combinations", title="How many combinations?", skills=["sql-cross-join"], difficulty="intro", kind="predict-output",
   purpose="Before running a big CROSS JOIN, estimate its size.",
   task="Write a query returning one number, **combinations**: how many rows a CROSS JOIN of warehouses and suppliers produces.",
   starter="SELECT COUNT(*) AS combinations\nFROM warehouses\n",
   solution="SELECT COUNT(*) AS combinations\nFROM warehouses\nCROSS JOIN suppliers;",
   hints=["Predict first: rows in warehouses × rows in suppliers.", "Add `CROSS JOIN suppliers` and count."],
   constructs=["CROSS JOIN"], order=False)
ex(id="sql.cross-join.carrier-warehouse-rates", title="Carrier coverage sheet", skills=["sql-cross-join"], difficulty="core", kind="business",
   purpose="Logistics builds a rate sheet: every carrier used so far against every warehouse region.",
   task="Return each distinct shipment **carrier** paired with each distinct warehouse **region**. Sort by carrier, region.",
   starter="SELECT c.carrier, r.region\nFROM (SELECT DISTINCT carrier FROM shipments) c\n",
   solution="SELECT c.carrier, r.region\nFROM (SELECT DISTINCT carrier FROM shipments) c\nCROSS JOIN (SELECT DISTINCT region FROM warehouses) r\nORDER BY c.carrier, r.region;",
   hints=["Both sides should be distinct lists first.", "CROSS JOIN the two subqueries."],
   constructs=["CROSS JOIN"], order=True)
ex(id="sql.cross-join.debug-accidental", title="Debug: the accidental CROSS JOIN", skills=["sql-cross-join", "sql-inner-join"], difficulty="stretch", kind="debugging",
   purpose="An order report returns far too many rows: a join condition is missing.",
   task="Fix the query so it returns each sales order's **so_id** and the customer **name** (one row per order).",
   starter="SELECT s.so_id, c.name\nFROM sales_orders s, customers c;",
   solution="SELECT s.so_id, c.name\nFROM sales_orders s\nJOIN customers c ON c.customer_id = s.customer_id;",
   hints=["A comma between tables with no condition is an implicit CROSS JOIN.", "Join on `c.customer_id = s.customer_id`."],
   constructs=["JOIN"], order=False)

# ---------- UNION / UNION ALL (5) ----------
ex(id="sql.union.all-cities", title="Every city we deal with (no duplicates)", skills=["sql-union"], difficulty="intro", kind="targeted",
   purpose="Marketing needs a de-duplicated list of cities where we have customers or warehouses.",
   task="Return one column **city** listing each city that has a customer or a warehouse, without duplicates.",
   starter="SELECT city FROM customers\n",
   solution="SELECT city FROM customers\nUNION\nSELECT city FROM warehouses;",
   hints=["UNION stacks two result sets with the same columns.", "Plain UNION removes duplicates; UNION ALL keeps them."],
   constructs=["UNION"], order=False)
ex(id="sql.union-all.stock-movements", title="One list of stock movements", skills=["sql-union-all"], difficulty="core", kind="business",
   purpose="Inventory control wants receipts (in) and sales lines (out) in one movement list, keeping every movement.",
   task="Return **product_id**, **qty** and **direction** ('IN' for receipt lines, 'OUT' for sales order lines). Receipt lines: join to po_lines on (po_id, line_no) for product_id. Keep duplicates.",
   starter="SELECT pl.product_id, rl.qty_received AS qty, 'IN' AS direction\nFROM receipt_lines rl\nJOIN po_lines pl ON pl.po_id = rl.po_id AND pl.line_no = rl.line_no\n",
   solution="SELECT pl.product_id, rl.qty_received AS qty, 'IN' AS direction\nFROM receipt_lines rl\nJOIN po_lines pl ON pl.po_id = rl.po_id AND pl.line_no = rl.line_no\nUNION ALL\nSELECT product_id, qty, 'OUT'\nFROM so_lines;",
   hints=["Two identical movements are both real; don't let UNION remove them.", "Use UNION ALL; column count and order must match."],
   constructs=["UNION ALL"], order=False)
ex(id="sql.union.contact-directory", title="Supplier and customer contact directory", skills=["sql-union"], difficulty="core", kind="business",
   purpose="Reception keeps one directory of organisations with their type.",
   task="Return **name**, **city** and **type** ('Supplier' or 'Customer') for all suppliers and customers. Sort by name.",
   starter="SELECT name, city, 'Supplier' AS type FROM suppliers\n",
   solution="SELECT name, city, 'Supplier' AS type FROM suppliers\nUNION\nSELECT name, city, 'Customer' FROM customers\nORDER BY name;",
   hints=["Add a literal column so each row says where it came from.", "ORDER BY goes once, after the last SELECT."],
   constructs=["UNION"], order=True)
ex(id="sql.union-all.count-difference", title="UNION vs UNION ALL: count the difference", skills=["sql-union", "sql-union-all"], difficulty="stretch", kind="predict-output",
   purpose="Understand exactly how many duplicates UNION removes.",
   task="Return one row with **with_dupes** (rows from customer cities UNION ALL warehouse cities) and **without_dupes** (same with UNION).",
   starter="SELECT\n  (SELECT COUNT(*) FROM (SELECT city FROM customers UNION ALL SELECT city FROM warehouses)) AS with_dupes,\n  0 AS without_dupes;",
   solution="SELECT\n  (SELECT COUNT(*) FROM (SELECT city FROM customers UNION ALL SELECT city FROM warehouses)) AS with_dupes,\n  (SELECT COUNT(*) FROM (SELECT city FROM customers UNION SELECT city FROM warehouses)) AS without_dupes;",
   hints=["Predict both numbers before running.", "Replace the 0 with a second scalar subquery using UNION."],
   constructs=["UNION ALL", "UNION"], order=False)
ex(id="sql.union-all.open-items-report", title="Open items across purchasing and sales", skills=["sql-union-all"], difficulty="core", kind="business",
   purpose="The operations lead reviews all open documents in one list.",
   task="Return **doc_type** ('PO' or 'SO'), **doc_id** and **order_date** for open purchase orders and open sales orders. Sort by order_date, then doc_type, then doc_id.",
   starter="SELECT 'PO' AS doc_type, po_id AS doc_id, order_date FROM purchase_orders WHERE status = 'Open'\n",
   solution="SELECT 'PO' AS doc_type, po_id AS doc_id, order_date FROM purchase_orders WHERE status = 'Open'\nUNION ALL\nSELECT 'SO', so_id, order_date FROM sales_orders WHERE status = 'Open'\nORDER BY order_date, doc_type, doc_id;",
   hints=["Both halves filter on status = 'Open'.", "UNION ALL is right here: a PO and an SO are never duplicates of each other."],
   constructs=["UNION ALL"], order=True)

# ---------- WITH / CTE (5) ----------
ex(id="sql.cte.supplier-spend", title="Supplier spend with a CTE", skills=["sql-cte", "sql-aggregates"], difficulty="intro", kind="targeted",
   purpose="Finance ranks suppliers by total ordered value.",
   task="Using a CTE, return supplier **name** and **total_spend** (sum of qty_ordered × unit_cost over their PO lines) for suppliers with POs. Sort by total_spend descending.",
   starter="WITH po_value AS (\n  -- total per supplier\n)\nSELECT s.name, v.total_spend\nFROM po_value v\nJOIN suppliers s ON s.supplier_id = v.supplier_id\nORDER BY v.total_spend DESC;",
   solution="WITH po_value AS (\n  SELECT po.supplier_id, SUM(l.qty_ordered * l.unit_cost) AS total_spend\n  FROM purchase_orders po\n  JOIN po_lines l ON l.po_id = po.po_id\n  GROUP BY po.supplier_id\n)\nSELECT s.name, v.total_spend\nFROM po_value v\nJOIN suppliers s ON s.supplier_id = v.supplier_id\nORDER BY v.total_spend DESC;",
   hints=["Inside the CTE, join purchase_orders to po_lines and GROUP BY supplier_id.", "The outer query reads the CTE like a table."],
   constructs=["WITH"], order=True)
ex(id="sql.cte.outstanding-qty", title="Outstanding quantity per PO line", skills=["sql-cte", "sql-left-join"], difficulty="core", kind="business",
   purpose="Receiving needs remaining quantities, including partially received lines.",
   task="Using a CTE for received totals, return **po_id**, **line_no** and **outstanding** (qty_ordered minus total received, treating none as 0) for lines still outstanding (> 0). Sort by po_id, line_no.",
   starter="WITH received AS (\n  SELECT po_id, line_no, SUM(qty_received) AS qty\n  FROM receipt_lines\n  GROUP BY po_id, line_no\n)\nSELECT l.po_id, l.line_no\nFROM po_lines l\n",
   solution="WITH received AS (\n  SELECT po_id, line_no, SUM(qty_received) AS qty\n  FROM receipt_lines\n  GROUP BY po_id, line_no\n)\nSELECT l.po_id, l.line_no, l.qty_ordered - COALESCE(r.qty, 0) AS outstanding\nFROM po_lines l\nLEFT JOIN received r ON r.po_id = l.po_id AND r.line_no = l.line_no\nWHERE l.qty_ordered - COALESCE(r.qty, 0) > 0\nORDER BY l.po_id, l.line_no;",
   hints=["LEFT JOIN the CTE so lines with no receipt stay.", "COALESCE(r.qty, 0) turns 'nothing received' into 0."],
   constructs=["WITH", "LEFT JOIN"], order=True)
ex(id="sql.cte.price-discrepancies", title="Invoice price discrepancies", skills=["sql-cte", "sql-inner-join"], difficulty="core", kind="business",
   purpose="Accounts payable holds invoices whose unit cost differs from the PO.",
   task="With a CTE that pairs invoice lines with PO lines, return **invoice_id**, **po_id**, **line_no**, **po_cost**, **invoiced_cost** and **difference** (invoiced minus PO) where they differ.",
   starter="WITH paired AS (\n  SELECT i.invoice_id, i.po_id, i.line_no, l.unit_cost AS po_cost, i.invoiced_unit_cost AS invoiced_cost\n  FROM supplier_invoices i\n  JOIN po_lines l ON l.po_id = i.po_id AND l.line_no = i.line_no\n)\nSELECT * FROM paired;",
   solution="WITH paired AS (\n  SELECT i.invoice_id, i.po_id, i.line_no, l.unit_cost AS po_cost, i.invoiced_unit_cost AS invoiced_cost\n  FROM supplier_invoices i\n  JOIN po_lines l ON l.po_id = i.po_id AND l.line_no = i.line_no\n)\nSELECT invoice_id, po_id, line_no, po_cost, invoiced_cost, invoiced_cost - po_cost AS difference\nFROM paired\nWHERE invoiced_cost <> po_cost;",
   hints=["The CTE is already written; finish the outer query.", "Filter where the two costs differ and compute the difference."],
   constructs=["WITH"], order=False)
ex(id="sql.cte.below-reorder", title="Stock below reorder point, by warehouse", skills=["sql-cte", "sql-aggregates"], difficulty="intro", kind="targeted",
   purpose="Replenishment planners start with the count of low-stock items per warehouse.",
   task="Use a CTE `low` for inventory rows with on_hand below reorder_point, then return warehouse **code** and **low_items** for warehouses with at least one. Sort by code.",
   starter="WITH low AS (\n  SELECT * FROM inventory WHERE on_hand < reorder_point\n)\nSELECT w.code\nFROM warehouses w\n",
   solution="WITH low AS (\n  SELECT * FROM inventory WHERE on_hand < reorder_point\n)\nSELECT w.code, COUNT(*) AS low_items\nFROM low\nJOIN warehouses w ON w.warehouse_id = low.warehouse_id\nGROUP BY w.warehouse_id, w.code\nORDER BY w.code;",
   hints=["Join the CTE to warehouses.", "GROUP BY warehouse and COUNT(*)."],
   constructs=["WITH"], order=True)
ex(id="sql.cte.two-step-top-customers", title="Two CTEs: top customers by revenue", skills=["sql-cte", "sql-aggregates"], difficulty="stretch", kind="targeted",
   purpose="Sales leadership wants customers whose revenue is above the average customer revenue.",
   task="Use one CTE for revenue per customer (sum of qty × unit_price) and a second for the average of those revenues. Return **name** and **revenue** for customers above average, highest first.",
   starter="WITH revenue AS (\n  -- per customer\n), avg_rev AS (\n  -- one row\n)\nSELECT ...;",
   solution="WITH revenue AS (\n  SELECT s.customer_id, SUM(l.qty * l.unit_price) AS revenue\n  FROM sales_orders s\n  JOIN so_lines l ON l.so_id = s.so_id\n  GROUP BY s.customer_id\n), avg_rev AS (\n  SELECT AVG(revenue) AS a FROM revenue\n)\nSELECT c.name, r.revenue\nFROM revenue r\nJOIN customers c ON c.customer_id = r.customer_id\nCROSS JOIN avg_rev\nWHERE r.revenue > avg_rev.a\nORDER BY r.revenue DESC;",
   hints=["Separate CTEs with a comma; the second can read the first.", "Combine the one-row CTE with CROSS JOIN (or a scalar subquery) to compare."],
   constructs=["WITH"], order=True)

# ---------- Mixed (5) ----------
ex(id="sql.mixed.customer-activity-status", title="Customer activity status", skills=["sql-cte", "sql-left-join", "sql-union"], difficulty="core", kind="business",
   purpose="CRM tags customers as 'Active' (has orders) or 'Prospect' (none).",
   task="Return **name** and **status** for every customer: 'Active' if they have at least one sales order, else 'Prospect'. Use a CTE for customers with orders.",
   starter="WITH buyers AS (\n  SELECT DISTINCT customer_id FROM sales_orders\n)\nSELECT c.name\nFROM customers c\n",
   solution="WITH buyers AS (\n  SELECT DISTINCT customer_id FROM sales_orders\n)\nSELECT c.name, CASE WHEN b.customer_id IS NULL THEN 'Prospect' ELSE 'Active' END AS status\nFROM customers c\nLEFT JOIN buyers b ON b.customer_id = c.customer_id;",
   hints=["LEFT JOIN the CTE to customers.", "CASE WHEN b.customer_id IS NULL THEN 'Prospect' ELSE 'Active' END."],
   constructs=["WITH", "LEFT JOIN"], order=False)
ex(id="sql.mixed.unshipped-by-carrier-gap", title="Orders with no shipment or no ship date", skills=["sql-left-join", "sql-union-all"], difficulty="core", kind="business",
   purpose="Customer service follows up on orders that have not physically left.",
   task="Return **so_id** and **reason**: 'No shipment' for orders without a shipment row, and 'Not shipped yet' for shipments with no shipped_date. Combine with UNION ALL. Sort by so_id.",
   starter="SELECT s.so_id, 'No shipment' AS reason\nFROM sales_orders s\nLEFT JOIN shipments sh ON sh.so_id = s.so_id\nWHERE sh.shipment_id IS NULL\n",
   solution="SELECT s.so_id, 'No shipment' AS reason\nFROM sales_orders s\nLEFT JOIN shipments sh ON sh.so_id = s.so_id\nWHERE sh.shipment_id IS NULL\nUNION ALL\nSELECT so_id, 'Not shipped yet'\nFROM shipments\nWHERE shipped_date IS NULL\nORDER BY so_id;",
   hints=["First half is written. Add the second half from shipments.", "NULL checks use IS NULL, never = NULL."],
   constructs=["LEFT JOIN", "UNION ALL"], order=True)
ex(id="sql.mixed.coverage-by-region", title="Category coverage by region", skills=["sql-cross-join", "sql-cte", "sql-left-join"], difficulty="stretch", kind="business",
   purpose="Find which product categories have zero stock anywhere in each region.",
   task="Return **region** and **category** pairs where total on_hand across that region's warehouses for that category is 0 or no stock rows exist. Use a CTE for stock per region and category, and CROSS JOIN for all pairs. Sort by region, category.",
   starter="WITH stock AS (\n  SELECT w.region, p.category, SUM(i.on_hand) AS qty\n  FROM inventory i\n  JOIN warehouses w ON w.warehouse_id = i.warehouse_id\n  JOIN products p ON p.product_id = i.product_id\n  GROUP BY w.region, p.category\n)\nSELECT r.region, c.category\nFROM (SELECT DISTINCT region FROM warehouses) r\n",
   solution="WITH stock AS (\n  SELECT w.region, p.category, SUM(i.on_hand) AS qty\n  FROM inventory i\n  JOIN warehouses w ON w.warehouse_id = i.warehouse_id\n  JOIN products p ON p.product_id = i.product_id\n  GROUP BY w.region, p.category\n)\nSELECT r.region, c.category\nFROM (SELECT DISTINCT region FROM warehouses) r\nCROSS JOIN (SELECT DISTINCT category FROM products) c\nLEFT JOIN stock s ON s.region = r.region AND s.category = c.category\nWHERE COALESCE(s.qty, 0) = 0\nORDER BY r.region, c.category;",
   hints=["All region × category pairs come from a CROSS JOIN of two DISTINCT lists.", "LEFT JOIN the CTE and keep pairs where COALESCE(qty, 0) = 0."],
   constructs=["WITH", "CROSS JOIN", "LEFT JOIN"], order=True)
ex(id="sql.mixed.supplier-activity", title="Supplier activity summary", skills=["sql-left-join", "sql-aggregates", "sql-cte"], difficulty="core", kind="business",
   purpose="Vendor management reviews suppliers by PO count, including inactive ones.",
   task="Return supplier **name**, **po_count** (0 if none) and **activity** ('Inactive' when po_count = 0, else 'Active'). Use a CTE for PO counts.",
   starter="WITH counts AS (\n  SELECT supplier_id, COUNT(*) AS po_count FROM purchase_orders GROUP BY supplier_id\n)\nSELECT s.name\nFROM suppliers s\n",
   solution="WITH counts AS (\n  SELECT supplier_id, COUNT(*) AS po_count FROM purchase_orders GROUP BY supplier_id\n)\nSELECT s.name, COALESCE(c.po_count, 0) AS po_count,\n       CASE WHEN c.po_count IS NULL THEN 'Inactive' ELSE 'Active' END AS activity\nFROM suppliers s\nLEFT JOIN counts c ON c.supplier_id = s.supplier_id;",
   hints=["LEFT JOIN the CTE so inactive suppliers remain.", "COALESCE for the count, CASE for the label."],
   constructs=["WITH", "LEFT JOIN"], order=False)
ex(id="sql.mixed.debug-union-columns", title="Debug: UNION with mismatched columns", skills=["sql-union-all"], difficulty="intro", kind="debugging",
   purpose="A contact export fails because the two halves don't line up.",
   task="Fix the query so it returns **name** and **city** for all suppliers followed by all customers, keeping duplicates.",
   starter="SELECT name, city, country FROM suppliers\nUNION ALL\nSELECT name, city FROM customers;",
   solution="SELECT name, city FROM suppliers\nUNION ALL\nSELECT name, city FROM customers;",
   hints=["Read the error: each SELECT in a UNION must return the same number of columns.", "Drop the extra column so both halves have name, city."],
   constructs=["UNION ALL"], order=False)
