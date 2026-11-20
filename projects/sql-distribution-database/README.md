# Project 01 — Distribution Operations Database

**Status:** Planned  
**Stage:** SQL foundation  
**Purpose:** Demonstrate the ability to design a small relational database and answer practical inventory and procurement questions.

## Business scenario

Create a fictional parts distributor. The database tracks products, suppliers, customers, purchase orders, purchase order lines, goods receipts, supplier invoices and inventory movements.

## Suggested schema

- suppliers
- customers
- products
- purchase_orders
- purchase_order_lines
- goods_receipts
- goods_receipt_lines
- supplier_invoices
- supplier_invoice_lines
- inventory_movements

Use primary keys and foreign keys to represent relationships. Add appropriate data types and constraints. Keep the model understandable rather than over-engineering it.

## Required exercises

- Retrieve products and current stock.
- Find products below a reorder threshold.
- Calculate inventory value.
- Summarize order count and total spend by supplier.
- Find open purchase orders.
- Join purchase orders to suppliers and line items.
- Compare ordered and received quantities.
- Identify invoice quantities or prices that differ from the purchase order.
- Insert a supplier and purchase order.
- Update test inventory safely.
- Demonstrate a transaction and rollback.
- Write a useful subquery or CTE report.

## Deliverables

- `database/schema.sql`
- `database/sample_data.sql`
- Organized query files.
- Entity-relationship diagram.
- README explaining the scenario, schema and example findings.
- Screenshots or output samples.
- 5–10 minute recorded walkthrough.
- Tests or repeatable validation queries where practical.

## Suggested folder structure

```text
sql-distribution-database/
├── README.md
├── database/
│   ├── schema.sql
│   └── sample_data.sql
├── queries/
│   ├── basic_queries.sql
│   ├── inventory_reports.sql
│   ├── procurement_reports.sql
│   └── discrepancy_checks.sql
├── docs/
│   ├── entity-relationship-diagram.png
│   └── business-requirements.md
└── demo/
    └── demo-video-link.md
```

## Completion standard

A reviewer should be able to understand the fictional business, create the database, load the sample data, run the queries and see why the results are useful.
