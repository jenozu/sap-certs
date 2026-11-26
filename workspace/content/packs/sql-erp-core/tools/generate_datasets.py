"""Deterministic synthetic distributor data (fictional names only) for sql-erp-core.

Writes datasets/base.sql, datasets/variant-b.sql, datasets/variant-c.sql. Same schema,
different values. Edge cases are added explicitly in every variant:
  - customers with no sales orders, products never sold, suppliers with no POs
  - duplicate city names across customers and warehouses
  - partial receipts and POs with no receipts (outstanding)
  - NULL emails / NULL phone / NULL ship dates (open shipments)
  - multiple branches (warehouses) and price discrepancies (invoice price != PO price)
Run: python3 tools/generate_datasets.py  (from the pack folder)
"""
import random
from pathlib import Path

SCHEMA = """CREATE TABLE warehouses (warehouse_id INTEGER PRIMARY KEY, code TEXT NOT NULL, city TEXT NOT NULL, region TEXT NOT NULL);
CREATE TABLE suppliers (supplier_id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL, email TEXT);
CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, segment TEXT NOT NULL, phone TEXT);
CREATE TABLE products (product_id INTEGER PRIMARY KEY, sku TEXT NOT NULL UNIQUE, description TEXT NOT NULL, category TEXT NOT NULL, unit_price REAL NOT NULL, supplier_id INTEGER REFERENCES suppliers(supplier_id));
CREATE TABLE inventory (warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id), product_id INTEGER NOT NULL REFERENCES products(product_id), on_hand INTEGER NOT NULL, reorder_point INTEGER NOT NULL, PRIMARY KEY (warehouse_id, product_id));
CREATE TABLE purchase_orders (po_id INTEGER PRIMARY KEY, supplier_id INTEGER NOT NULL REFERENCES suppliers(supplier_id), warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id), order_date TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE po_lines (po_id INTEGER NOT NULL REFERENCES purchase_orders(po_id), line_no INTEGER NOT NULL, product_id INTEGER NOT NULL REFERENCES products(product_id), qty_ordered INTEGER NOT NULL, unit_cost REAL NOT NULL, PRIMARY KEY (po_id, line_no));
CREATE TABLE receipts (receipt_id INTEGER PRIMARY KEY, po_id INTEGER NOT NULL REFERENCES purchase_orders(po_id), received_date TEXT NOT NULL);
CREATE TABLE receipt_lines (receipt_id INTEGER NOT NULL REFERENCES receipts(receipt_id), po_id INTEGER NOT NULL, line_no INTEGER NOT NULL, qty_received INTEGER NOT NULL, PRIMARY KEY (receipt_id, line_no));
CREATE TABLE supplier_invoices (invoice_id INTEGER PRIMARY KEY, po_id INTEGER NOT NULL REFERENCES purchase_orders(po_id), line_no INTEGER NOT NULL, invoiced_qty INTEGER NOT NULL, invoiced_unit_cost REAL NOT NULL, invoice_date TEXT NOT NULL);
CREATE TABLE sales_orders (so_id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(customer_id), warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id), order_date TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE so_lines (so_id INTEGER NOT NULL REFERENCES sales_orders(so_id), line_no INTEGER NOT NULL, product_id INTEGER NOT NULL REFERENCES products(product_id), qty INTEGER NOT NULL, unit_price REAL NOT NULL, PRIMARY KEY (so_id, line_no));
CREATE TABLE shipments (shipment_id INTEGER PRIMARY KEY, so_id INTEGER NOT NULL REFERENCES sales_orders(so_id), carrier TEXT NOT NULL, shipped_date TEXT, tracking TEXT);
"""

CITIES = ["Halton", "Riverton", "Lakeside", "Northgate", "Fairport", "Brookfield", "Maplewood", "Port Ellis"]
SUP_NAMES = ["Atlas Fluid Parts", "Beacon Seals", "Cobalt Fasteners", "Delta Drive Co", "Evergreen Bearings", "Fulcrum Hydraulics", "Granite Gaskets", "Harbor Hose Supply"]
CUST_NAMES = ["Alder Marine", "Birchline Logistics", "Cedar Works", "Dunmore Power", "Elm Street Repair", "Foxglove Farms", "Glenview Mills", "Hollis Energy", "Ironbark Pumps", "Juniper Rail", "Kestrel Ports", "Larch Industrial"]
CATS = ["Pumps", "Seals", "Fasteners", "Bearings", "Hoses", "Filters"]
CARRIERS = ["NorthStar Freight", "Bluewater Courier", "Prairie Express"]

def q(v):
    if v is None: return "NULL"
    if isinstance(v, str): return "'" + v.replace("'", "''") + "'"
    return repr(v)

def ins(table, rows):
    return "".join(f"INSERT INTO {table} VALUES ({', '.join(q(v) for v in r)});\n" for r in rows)

def build(seed):
    r = random.Random(seed)
    city = lambda: r.choice(CITIES)
    wh = [(1, "WH-HAL", "Halton", "East"), (2, "WH-RIV", "Riverton", "West"), (3, "WH-LAK", "Lakeside", "East"), (4, "WH-NOR", "Northgate", "North")]
    if seed == 2: wh[3] = (4, "WH-FAI", "Fairport", "South")                     # variants differ in branches
    if seed == 3: wh.append((5, "WH-PEL", "Port Ellis", "West"))
    cats = CATS[:5] if seed == 2 else CATS + (["Valves"] if seed == 3 else [])
    carriers = CARRIERS[:2] if seed == 1 else CARRIERS if seed == 2 else CARRIERS + ["Summit Haulage"]
    sups = []
    for i, n in enumerate(r.sample(SUP_NAMES, 7 if seed == 2 else 6), 1):
        sups.append((i, n, city(), "Canada" if i % 3 else "USA", None if i == 2 else f"orders{i}@example.com"))
    custs = []
    for i, n in enumerate(r.sample(CUST_NAMES, 10), 1):
        c = "Halton" if i in (1, 4) else city()          # duplicate city on purpose (also a warehouse city)
        custs.append((i, n, c, r.choice(["Marine", "Industrial", "Energy"]), None if i % 4 == 0 else f"555-01{i:02d}"))
    prods = []
    for i in range(1, 15):
        cat = cats[(i - 1) % len(cats)]
        sup = 1 + (i % 5)                                # supplier 6 supplies nothing (edge case)
        prods.append((i, f"{cat[:3].upper()}-{100 + i * 7 + seed % 5}", f"{cat[:-1]} model {chr(64 + i)}", cat, round(r.uniform(4, 400), 2), sup))
    inv = [(w[0], p[0], 0 if (w[0] * p[0] + seed) % 7 == 0 else r.randint(0, 120), r.choice([10, 20, 30])) for w in wh for p in prods if (w[0] + p[0] + seed) % 3 != 0]
    pos, pol, rec, recl, sinv = [], [], [], [], []
    rid = 1; iid = 1
    for po in range(1, 11):
        sup = 1 + (po % 5)                                # supplier 6: no POs
        pos.append((po, sup, wh[po % 4][0], f"2026-0{1 + (po + seed) % 9}-{10 + po:02d}", "Open" if (po + seed) % 3 == 0 else "Closed"))
        lines = []
        for ln in range(1, r.randint(2, 4)):
            pid = r.choice([p[0] for p in prods if p[5] == sup] or [1])
            cost = round(r.uniform(3, 300), 2)
            qty = r.randint(5, 60)
            lines.append((po, ln, pid, qty, cost))
        pol += lines
        if po <= 7:                                      # POs 8-10 have no receipts (outstanding)
            rec.append((rid, po, f"2026-0{1 + po % 9}-{20 + po % 8:02d}"))
            for (_, ln, pid, qty, cost) in lines:
                got = qty if po % 3 else max(1, qty - r.randint(1, qty - 1 if qty > 1 else 1))   # partial receipts
                recl.append((rid, po, ln, got))
                if po <= 6:
                    price = cost if ln != 1 or po % 2 else round(cost * 1.08, 2)               # price discrepancies
                    sinv.append((iid, po, ln, got, price, f"2026-0{1 + po % 9}-{25:02d}")); iid += 1
            rid += 1
    sos, sol, shp = [], [], []
    sold = [p[0] for p in prods[:-3]]                    # last 3 products never sold
    sid = 1
    for so in range(1, 19):
        cust = 1 + (so % 8)                              # customers 9 and 10: no orders
        sos.append((so, cust, wh[so % 4][0], f"2026-0{1 + (so * seed) % 9}-{1 + so:02d}", "Shipped" if (so + seed) % 4 else "Open"))
        for ln in range(1, r.randint(2, 4)):
            pid = r.choice(sold)
            price = next(p[4] for p in prods if p[0] == pid)
            sol.append((so, ln, pid, r.randint(1, 25), price))
        if (so + seed) % 5:
            shp.append((sid, so, r.choice(carriers), None if (so + seed) % 6 == 0 else f"2026-0{1 + so % 9}-{2 + so:02d}", None if (so + seed) % 6 == 0 else f"TRK{seed}{so:04d}")); sid += 1
    return "".join([
        f"-- sql-erp-core synthetic distributor data (seed {seed}). Fictional names only.\n", SCHEMA,
        ins("warehouses", wh), ins("suppliers", sups), ins("customers", custs), ins("products", prods), ins("inventory", inv),
        ins("purchase_orders", pos), ins("po_lines", pol), ins("receipts", rec), ins("receipt_lines", recl), ins("supplier_invoices", sinv),
        ins("sales_orders", sos), ins("so_lines", sol), ins("shipments", shp),
    ])

if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "datasets"
    for name, seed in (("base", 1), ("variant-b", 2), ("variant-c", 3)):
        (out / f"{name}.sql").write_text(build(seed))
        print("wrote", name)
