import { useMemo } from "react";
import { useData } from "../context/DataContext";
import toast from "react-hot-toast";
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileBarChart,
  FileArchive,
} from "lucide-react";

export default function Reports() {
  const { products, recommendations } = useData();

  // Helper to generate and download CSV files dynamically
  const downloadCSV = (data, headers, filename) => {
    if (!data || data.length === 0) {
      toast.error("No data available to generate report. Make sure a dataset is loaded.");
      return;
    }

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((field) => `"${row[field] !== undefined ? String(row[field]).replace(/"/g, '""') : ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} downloaded!`);
  };

  const reports = useMemo(() => {
    return [
      {
        id: 1,
        title: "Store Revenue Report",
        description: "Monthly sales, price, stock level, and revenue performance across all products.",
        type: "CSV",
        date: "Generated dynamically from active dataset",
        onClick: () => downloadCSV(
          products,
          ["product", "category", "brand", "price", "stock", "sales", "revenue"],
          "Store_Revenue_Report.csv"
        ),
      },
      {
        id: 2,
        title: "Competitor Price Indexing Report",
        description: "Discrepancies, pricing headspace, and competitor pricing position comparison.",
        type: "CSV",
        date: "Generated dynamically from active dataset",
        onClick: () => downloadCSV(
          products.filter(p => Number(p.competitorPrice || 0) > 0),
          ["product", "price", "competitorPrice", "priceDifference", "profitMargin"],
          "Competitor_Price_Indexing_Report.csv"
        ),
      },
      {
        id: 3,
        title: "AI Dynamic Price Recommendations Report",
        description: "Optimal price targets, pricing logic, and strategy explanations calculated by AI.",
        type: "CSV",
        date: "Generated dynamically from active dataset",
        onClick: () => downloadCSV(
          recommendations,
          ["product", "price", "recommendation", "reason"],
          "AI_Price_Recommendations_Report.csv"
        ),
      },
    ];
  }, [products, recommendations]);

  const stats = useMemo(() => {
    return [
      {
        title: "Report Categories",
        value: "3",
        icon: FileText,
        color: "bg-blue-500",
      },
      {
        title: "Revenue Datasets",
        value: products.length > 0 ? "1 Active" : "0",
        icon: FileBarChart,
        color: "bg-green-500",
      },
      {
        title: "Optimized Products",
        value: recommendations.length.toString(),
        icon: FileSpreadsheet,
        color: "bg-purple-500",
      },
    ];
  }, [products, recommendations]);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <FileArchive className="text-blue-600" size={36} />
          System Reports
        </h1>
        <p className="text-slate-500 text-lg mt-2">
          Compile data queries and download CSV spreadsheets containing sales analytics, competitor indexes, and pricing rules.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex items-center justify-between hover:shadow-lg transition duration-200"
            >
              <div>
                <p className="text-slate-500 font-medium text-sm">{item.title}</p>
                <h2 className="text-3xl font-extrabold text-slate-800 mt-2">{item.value}</h2>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-sm`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports Directory */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-2xl font-bold text-slate-800">Dynamic Business Intelligence Reports</h2>
          <p className="text-slate-500 text-sm mt-1">
            Choose a directory category to download active inventory data streams.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 hover:bg-slate-50/30 transition gap-4"
            >
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-lg">{report.title}</h3>
                <p className="text-slate-500 text-sm max-w-xl">{report.description}</p>
                <span className="text-xs text-slate-400 block pt-1">{report.date}</span>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                  {report.type}
                </span>

                <button
                  onClick={report.onClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-md hover:shadow-blue-200 transition text-sm"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}