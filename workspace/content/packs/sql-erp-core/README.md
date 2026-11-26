# sql-erp-core (seed pack)

Seed SQL practice on a **synthetic** distributor database (fictional names only; no employer data).
Seed content, not a fixed curriculum: more packs and languages are added through the pack pipeline.

## Tables
warehouses · suppliers · customers · products · inventory · purchase_orders · po_lines · receipts ·
receipt_lines · supplier_invoices · sales_orders · so_lines · shipments

## Fixtures
`base`, `variant-b`, `variant-c`: same schema, different values (branches, categories, carriers, statuses,
dates, supplier count). Every graded exercise is checked on all three, so hard-coded answers fail.

Edge cases present in every fixture (proved by the generator's checks):
customers without orders, products never sold, suppliers without POs, duplicate city names, POs without
receipts, partial receipts, invoice price discrepancies, open shipments (NULL ship date), NULL phones/emails.

## Editing
Edit `tools/exercises.py` or `tools/generate_datasets.py`, then from this folder run
`python3 tools/generate_datasets.py && python3 tools/build_pack.py`, then `npm run content:verify`.
Changing an existing exercise's content requires bumping its `exerciseVersion`.
