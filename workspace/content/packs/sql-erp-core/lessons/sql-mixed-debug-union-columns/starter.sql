SELECT name, city, country FROM suppliers
UNION ALL
SELECT name, city FROM customers;
