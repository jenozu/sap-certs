SELECT po.po_id, s.name, po.order_date
FROM purchase_orders po
JOIN suppliers s ON s.supplier_id = po.supplier_id
LEFT JOIN receipts r ON r.po_id = po.po_id
WHERE r.receipt_id IS NULL
ORDER BY po.po_id;
