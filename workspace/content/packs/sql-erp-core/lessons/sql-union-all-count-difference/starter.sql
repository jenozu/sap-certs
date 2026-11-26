SELECT
  (SELECT COUNT(*) FROM (SELECT city FROM customers UNION ALL SELECT city FROM warehouses)) AS with_dupes,
  0 AS without_dupes;
