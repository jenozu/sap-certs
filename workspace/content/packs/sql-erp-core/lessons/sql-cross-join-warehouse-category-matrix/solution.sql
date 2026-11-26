SELECT w.code, c.category
FROM warehouses w
CROSS JOIN (SELECT DISTINCT category FROM products) c
ORDER BY w.code, c.category;
