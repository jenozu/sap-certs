SELECT w.code, COUNT(s.so_id) AS open_orders
FROM warehouses w
LEFT JOIN sales_orders s ON s.warehouse_id = w.warehouse_id AND s.status = 'Open'
GROUP BY w.warehouse_id, w.code;
