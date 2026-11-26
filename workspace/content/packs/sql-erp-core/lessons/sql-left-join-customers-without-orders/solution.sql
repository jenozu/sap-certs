SELECT c.name, c.city
FROM customers c
LEFT JOIN sales_orders s ON s.customer_id = c.customer_id
WHERE s.so_id IS NULL
ORDER BY c.name;
