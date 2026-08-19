export const columnMap = {
  product: [
    "Product",
    "Product Name",
    "Name",
    "Item",
    "Title"
  ],

  category: [
    "Category",
    "Type",
    "Department"
  ],

  brand: [
    "Brand",
    "Company",
    "Manufacturer"
  ],

  price: [
    "Price",
    "Selling Price",
    "Unit Price",
    "Cost",
    "Amount"
  ],

  stock: [
    "Stock",
    "Inventory",
    "Quantity",
    "Qty",
    "Available"
  ],

  sales: [
    "Sales",
    "Units Sold",
    "Sold",
    "Orders"
  ],

  revenue: [
    "Revenue",
    "Income",
    "Turnover"
  ],

  competitorPrice: [
    "Competitor Price",
    "Market Price",
    "Competitor"
  ],

  month: [
    "Month",
    "Date",
    "Order Month"
  ]
};

export function getValue(row, names) {
  const keys = Object.keys(row);

  for (const key of keys) {
    const normalizedKey = key
      .toLowerCase()
      .replace(/[_\-\s]/g, "");

    for (const name of names) {
      const normalizedName = name
        .toLowerCase()
        .replace(/[_\-\s]/g, "");

      if (normalizedKey === normalizedName) {
        return row[key];
      }
    }
  }

  return "";
}
export function normalizeDataset(data) {
  return data.map((row, index) => ({
    id: index + 1,

    product: getValue(row, columnMap.product),

    category: getValue(row, columnMap.category),

    brand: getValue(row, columnMap.brand),

    price: parseFloat(
      String(getValue(row, columnMap.price))
        .replace(/[$,]/g, "")
    ) || 0,

    stock: parseInt(
      getValue(row, columnMap.stock)
    ) || 0,

    sales: parseInt(
      getValue(row, columnMap.sales)
    ) || 0,

    revenue: parseFloat(
      String(getValue(row, columnMap.revenue))
        .replace(/[$,]/g, "")
    ) || 0,

    competitorPrice: parseFloat(
      String(getValue(row, columnMap.competitorPrice))
        .replace(/[$,]/g, "")
    ) || 0,

    month: getValue(row, columnMap.month),

    raw: row,
  }));
}