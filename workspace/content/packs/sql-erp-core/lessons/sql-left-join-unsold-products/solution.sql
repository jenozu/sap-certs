SELECT p.sku, p.description
FROM products p
LEFT JOIN so_lines l ON l.product_id = p.product_id
WHERE l.so_id IS NULL;
