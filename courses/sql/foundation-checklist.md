# SQL Foundation Checklist

Use this as the finish line for moving from SQL to JavaScript. The goal is practical working knowledge for building business applications, not database-specialist expertise.

## 1. Query structure

- [ ] SELECT — choose columns.
- [ ] FROM — choose source table(s).
- [ ] DISTINCT — remove duplicate result rows.
- [ ] AS — assign column/table aliases.
- [ ] ORDER BY with ASC and DESC.
- [ ] LIMIT (and understand that syntax varies by database).

## 2. Filtering and conditions

- [ ] WHERE.
- [ ] AND, OR and NOT; understand condition precedence and parentheses.
- [ ] IN and NOT IN.
- [ ] BETWEEN.
- [ ] LIKE and basic wildcard patterns.
- [ ] IS NULL and IS NOT NULL.
- [ ] Comparison operators: =, != / <>, >, <, >= and <=.

## 3. Aggregation and calculations

- [ ] COUNT, SUM, AVG, MIN and MAX.
- [ ] GROUP BY.
- [ ] HAVING versus WHERE.
- [ ] ROUND.
- [ ] COALESCE.
- [ ] CASE WHEN for conditional results.

## 4. Multiple tables and relationships

- [ ] INNER JOIN.
- [ ] LEFT JOIN.
- [ ] Understand RIGHT JOIN and FULL OUTER JOIN conceptually; support varies by database.
- [ ] Understand ON conditions and table aliases.
- [ ] Primary keys and foreign keys.
- [ ] One-to-one, one-to-many and many-to-many relationships.
- [ ] Understand why joins can multiply rows and affect totals.

## 5. Creating and changing data

- [ ] CREATE TABLE.
- [ ] INSERT INTO.
- [ ] UPDATE with a carefully scoped WHERE.
- [ ] DELETE with a carefully scoped WHERE.
- [ ] ALTER TABLE and DROP TABLE conceptually.
- [ ] Understand CRUD: Create, Read, Update and Delete.
- [ ] Know why an unqualified UPDATE or DELETE can affect every row.

## 6. Database design

- [ ] Tables, rows and columns.
- [ ] Common types: TEXT, INTEGER, DECIMAL/NUMERIC, DATE/TIMESTAMP and BOOLEAN (availability varies).
- [ ] NOT NULL, UNIQUE, DEFAULT, PRIMARY KEY and FOREIGN KEY constraints.
- [ ] Basic normalization and avoiding repeated facts.
- [ ] Basic indexes and the trade-off between faster reads and write/storage overhead.

## 7. Useful intermediate querying

- [ ] Basic subqueries.
- [ ] CASE expressions.
- [ ] UNION versus UNION ALL.
- [ ] EXISTS at a conceptual/basic usage level.
- [ ] Common Table Expressions (WITH).
- [ ] Basic date and string functions.
- [ ] Recognize that SQL dialects differ between SQLite, PostgreSQL, SQL Server and SAP HANA.

## 8. Transactions and data safety

- [ ] BEGIN / START TRANSACTION (syntax varies).
- [ ] COMMIT.
- [ ] ROLLBACK.
- [ ] Understand why related updates may need to succeed or fail together.
- [ ] Understand data integrity and referential integrity.
- [ ] Know that applications should validate input and use parameterized queries rather than concatenate untrusted input into SQL.

## Graduation standard

I am ready to move on when I can:
- [ ] Read and explain ordinary SELECT queries.
- [ ] Filter records using multiple conditions.
- [ ] Group records and calculate useful totals.
- [ ] Join related tables without accidentally double-counting.
- [ ] Create a small relational schema with primary and foreign keys.
- [ ] Insert, update and delete test data safely.
- [ ] Write a basic subquery or CTE with documentation/lookup help.
- [ ] Explain what a transaction does.
- [ ] Complete the SQL distribution database project and explain the business purpose of its reports.

I do not need to memorize every function or advanced syntax. Looking up documentation is normal.
