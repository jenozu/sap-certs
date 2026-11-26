SELECT w.code, p.sku
FROM warehouses w
CROSS JOIN products p
LEFT JOIN inventory i ON i.warehouse_id = w.warehouse_id AND i.product_id = p.product_id
WHERE i.product_id IS NULL;
