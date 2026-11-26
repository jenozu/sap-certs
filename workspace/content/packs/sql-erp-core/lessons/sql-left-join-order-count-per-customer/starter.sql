SELECT c.name, COUNT(*) AS order_count
FROM customers c
LEFT JOIN sales_orders s ON s.customer_id = c.customer_id
GROUP BY c.customer_id, c.name;
