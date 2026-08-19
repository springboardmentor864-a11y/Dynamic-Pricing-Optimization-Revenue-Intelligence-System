COLUMN_MAP = {
    "product": [
        "product",
        "product_name",
        "product name",
        "name",
        "item",
        "title",
        "product_title",
        "item_name",
        "product_description"
    ],
    "category": [
        "category",
        "product_category",
        "product category",
        "type",
        "department",
        "product_category_name",
        "cat",
        "group",
        "category_name"
    ],
    "brand": [
        "brand",
        "company",
        "manufacturer",
        "vendor",
        "make"
    ],
    "price": [
        "price",
        "selling price",
        "selling_price",
        "current_price",
        "current price",
        "amount",
        "unit_price",
        "unit price",
        "sale_price",
        "sale price",
        "mrp"
    ],
    "stock": [
        "stock",
        "inventory",
        "qty",
        "quantity",
        "available",
        "inventory_level",
        "stock_qty",
        "units_available",
        "in_stock"
    ],
    "sales": [
        "sales",
        "sold",
        "units sold",
        "units_sold",
        "orders",
        "order_count",
        "volume",
        "total_units",
        "total_sales",
        "sales_qty"
    ],
    "revenue": [
        "revenue",
        "income",
        "turnover",
        "total_revenue",
        "total revenue",
        "sales_revenue"
    ],
    "competitorPrice": [
        "competitorprice",
        "competitor price",
        "competitor_price",
        "marketprice",
        "market price",
        "comp_price"
    ],
    "costPrice": [
        "costprice",
        "cost price",
        "cost_price",
        "wholesale_price",
        "buy_price",
        "purchase_price",
        "unit_cost"
    ],
    "month": [
        "month",
        "date",
        "order month",
        "order_month",
        "timestamp",
        "period"
    ]
}


def normalize_dataframe(df):
    rename_dict = {}
    mapped_targets = set()

    # 1. Exact / Alias match first
    for column in df.columns:
        cleaned = (
            str(column)
            .strip()
            .lower()
            .replace("_", " ")
            .replace("-", " ")
        )

        mapped = None
        for standard, aliases in COLUMN_MAP.items():
            if standard in mapped_targets:
                continue
            if cleaned in aliases:
                mapped = standard
                break

        if mapped:
            rename_dict[column] = mapped
            mapped_targets.add(mapped)

    # 2. Substring/fuzzy matching for remaining unmapped columns
    for column in df.columns:
        if column in rename_dict:
            continue

        cleaned = (
            str(column)
            .strip()
            .lower()
            .replace("_", " ")
            .replace("-", " ")
        )

        mapped = None
        if "product" not in mapped_targets:
            if any(x in cleaned for x in ["product", "title", "item"]):
                mapped = "product"
        if not mapped and "category" not in mapped_targets:
            if any(x in cleaned for x in ["cat", "dept", "department", "type", "group"]):
                mapped = "category"
        if not mapped and "competitorPrice" not in mapped_targets:
            if any(x in cleaned for x in ["competitor", "comp", "market"]):
                mapped = "competitorPrice"
        if not mapped and "costPrice" not in mapped_targets:
            if any(x in cleaned for x in ["cost", "wholesale", "purchase"]):
                mapped = "costPrice"
        if not mapped and "price" not in mapped_targets:
            if "price" in cleaned or cleaned in ["rate", "amount"]:
                mapped = "price"
        if not mapped and "stock" not in mapped_targets:
            if any(x in cleaned for x in ["stock", "qty", "quantity", "inventory", "avail"]):
                mapped = "stock"
        if not mapped and "sales" not in mapped_targets:
            if any(x in cleaned for x in ["sales", "sold", "units", "orders", "volume"]):
                mapped = "sales"
        if not mapped and "revenue" not in mapped_targets:
            if any(x in cleaned for x in ["rev", "revenue", "income", "turnover"]):
                mapped = "revenue"
        if not mapped and "month" not in mapped_targets:
            if any(x in cleaned for x in ["month", "date", "year", "time"]):
                mapped = "month"
        if not mapped and "brand" not in mapped_targets:
            if any(x in cleaned for x in ["brand", "make", "vendor", "mfr", "manufacturer"]):
                mapped = "brand"

        if mapped:
            rename_dict[column] = mapped
            mapped_targets.add(mapped)

    df = df.rename(columns=rename_dict)
    return df