export function featureEngineering(data) {
  return data.map((item) => {
    const revenue =
      item.revenue ||
      item.price * item.sales;

    const cost = item.price * 0.7;

    const profit =
      revenue - cost * item.sales;

    const margin =
      revenue > 0
        ? (profit / revenue) * 100
        : 0;

    const demandScore =
      item.sales >= 500
        ? "High"
        : item.sales >= 200
        ? "Medium"
        : "Low";

    const inventoryHealth =
      item.stock >= 100
        ? "Healthy"
        : item.stock >= 30
        ? "Warning"
        : "Critical";

    const priceDifference =
      item.competitorPrice > 0
        ? item.price - item.competitorPrice
        : 0;

    const recommendation =
      priceDifference > 10
        ? "Decrease Price"
        : priceDifference < -10
        ? "Increase Price"
        : "Maintain Price";
        const aiScore =
  Math.min(
    100,
    Math.round(
      (margin * 0.4) +
      (item.sales * 0.08) +
      (item.stock * 0.02)
    )
  );

    return {
      ...item,

      revenue,

      profit,

      margin,

      demandScore,

      inventoryHealth,

      priceDifference,
aiScore,
      recommendation,
    };
  });
}