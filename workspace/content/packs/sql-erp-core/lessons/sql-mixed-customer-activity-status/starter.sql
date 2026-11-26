WITH buyers AS (
  SELECT DISTINCT customer_id FROM sales_orders
)
SELECT c.name
FROM customers c
