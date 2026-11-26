WITH buyers AS (
  SELECT DISTINCT customer_id FROM sales_orders
)
SELECT c.name, CASE WHEN b.customer_id IS NULL THEN 'Prospect' ELSE 'Active' END AS status
FROM customers c
LEFT JOIN buyers b ON b.customer_id = c.customer_id;
