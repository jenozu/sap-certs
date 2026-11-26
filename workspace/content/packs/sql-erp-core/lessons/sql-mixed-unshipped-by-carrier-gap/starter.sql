SELECT s.so_id, 'No shipment' AS reason
FROM sales_orders s
LEFT JOIN shipments sh ON sh.so_id = s.so_id
WHERE sh.shipment_id IS NULL
