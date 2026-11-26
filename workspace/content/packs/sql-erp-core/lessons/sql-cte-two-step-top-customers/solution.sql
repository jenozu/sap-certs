WITH revenue AS (
  SELECT s.customer_id, SUM(l.qty * l.unit_price) AS revenue
  FROM sales_orders s
  JOIN so_lines l ON l.so_id = s.so_id
  GROUP BY s.customer_id
), avg_rev AS (
  SELECT AVG(revenue) AS a FROM revenue
)
SELECT c.name, r.revenue
FROM revenue r
JOIN customers c ON c.customer_id = r.customer_id
CROSS JOIN avg_rev
WHERE r.revenue > avg_rev.a
ORDER BY r.revenue DESC;
