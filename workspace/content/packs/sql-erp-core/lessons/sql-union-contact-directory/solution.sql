SELECT name, city, 'Supplier' AS type FROM suppliers
UNION
SELECT name, city, 'Customer' FROM customers
ORDER BY name;
