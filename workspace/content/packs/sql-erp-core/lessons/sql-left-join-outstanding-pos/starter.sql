SELECT po.po_id, s.name, po.order_date
FROM purchase_orders po
JOIN suppliers s ON s.supplier_id = po.supplier_id
