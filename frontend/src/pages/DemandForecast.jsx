import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ForecastCards from "../components/ForecastCards";
import DemandChart from "../components/DemandChart";
import ForecastTable from "../components/ForecastTable";
import ForecastInsights from "../components/ForecastInsights";

export default function DemandForecast() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50">
      <Sidebar />

      <div className="ml-72">
        <Topbar />

        <main className="p-8 space-y-8">

          <div>
            <h1 className="text-4xl font-bold">
              Demand Forecast
            </h1>

            <p className="text-gray-500 mt-2">
              AI-powered demand prediction and future sales insights.
            </p>
          </div>

          <ForecastCards />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            <div className="xl:col-span-2 space-y-8">
              <DemandChart />
              <ForecastTable />
            </div>

            <ForecastInsights />

          </div>

        </main>
      </div>
    </div>
  );
}