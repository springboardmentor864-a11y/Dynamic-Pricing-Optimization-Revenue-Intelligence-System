export default function calculateStats(products) {

  const totalProducts = products.length;

  const totalRevenue = products.reduce(

    (sum, item) =>

      sum + Number(item.revenue || 0),

    0

  );

  const totalSales = products.reduce(

    (sum, item) =>

      sum + Number(item.sales || 0),

    0

  );

  const averagePrice =

    totalProducts > 0

      ? (

          products.reduce(

            (sum, item) =>

              sum + Number(item.price || 0),

            0

          ) / totalProducts

        ).toFixed(2)

      : 0;
        const lowStock = products.filter(

    (item) =>

      Number(item.stock || 0) < 20

  ).length;

  return {

    totalProducts,

    totalRevenue,

    totalSales,

    averagePrice,

    lowStock,

  };

}