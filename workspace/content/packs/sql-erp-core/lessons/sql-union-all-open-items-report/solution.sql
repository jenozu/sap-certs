SELECT 'PO' AS doc_type, po_id AS doc_id, order_date FROM purchase_orders WHERE status = 'Open'
UNION ALL
SELECT 'SO', so_id, order_date FROM sales_orders WHERE status = 'Open'
ORDER BY order_date, doc_type, doc_id;
