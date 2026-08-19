const data = [
  {
    id: 1,
    product: "Apple iPhone 16 Pro",
    current: 2400,
    forecast: 3100,
    confidence: "96%",
    action: "Increase",
  },
  {
    id: 2,
    product: "Samsung Galaxy S25",
    current: 1800,
    forecast: 2000,
    confidence: "92%",
    action: "Maintain",
  },
  {
    id: 3,
    product: "MacBook Air M4",
    current: 950,
    forecast: 1200,
    confidence: "98%",
    action: "Increase",
  },
];

export default function ForecastTable() {
  return (
    <div className="bg-white rounded-3xl shadow border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">
          Product Forecast
        </h2>
      </div>

      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-5">Product</th>
            <th className="text-center">Current</th>
            <th className="text-center">Forecast</th>
            <th className="text-center">Confidence</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="p-5 font-semibold">
                {item.product}
              </td>

              <td className="text-center">
                {item.current}
              </td>

              <td className="text-center font-bold text-blue-600">
                {item.forecast}
              </td>

              <td className="text-center">
                {item.confidence}
              </td>

              <td className="text-center">
                <span
                  className={`px-3 py-1 rounded-full ${
                    item.action === "Increase"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.action}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}