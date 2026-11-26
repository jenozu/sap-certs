SELECT c.carrier, r.region
FROM (SELECT DISTINCT carrier FROM shipments) c
