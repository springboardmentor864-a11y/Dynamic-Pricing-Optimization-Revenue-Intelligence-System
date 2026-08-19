export function cleanDataset(data) {
  const report = {
    totalRows: data.length,
    duplicatesRemoved: 0,
    missingPrices: 0,
    missingStock: 0,
    invalidRows: 0,
  };

  const uniqueProducts = new Set();

  const cleaned = data.filter((item) => {
    if (!item.product) {
      report.invalidRows++;
      return false;
    }

    const key = item.product.toLowerCase();

    if (uniqueProducts.has(key)) {
      report.duplicatesRemoved++;
      return false;
    }

    uniqueProducts.add(key);

    if (!item.price || isNaN(item.price)) {
      item.price = 0;
      report.missingPrices++;
    }

    if (!item.stock || isNaN(item.stock)) {
      item.stock = 0;
      report.missingStock++;
    }

    if (!item.sales || isNaN(item.sales)) {
      item.sales = 0;
    }

    if (!item.revenue) {
      item.revenue = item.price * item.sales;
    }

    return true;
  });

  return {
    cleaned,
    report,
  };
}