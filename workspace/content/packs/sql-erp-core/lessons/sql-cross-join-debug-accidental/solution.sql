SELECT s.so_id, c.name
FROM sales_orders s
JOIN customers c ON c.customer_id = s.customer_id;
