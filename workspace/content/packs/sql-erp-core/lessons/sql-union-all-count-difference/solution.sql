SELECT
  (SELECT COUNT(*) FROM (SELECT city FROM customers UNION ALL SELECT city FROM warehouses)) AS with_dupes,
  (SELECT COUNT(*) FROM (SELECT city FROM customers UNION SELECT city FROM warehouses)) AS without_dupes;
