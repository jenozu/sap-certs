SELECT c.carrier, r.region
FROM (SELECT DISTINCT carrier FROM shipments) c
CROSS JOIN (SELECT DISTINCT region FROM warehouses) r
ORDER BY c.carrier, r.region;
