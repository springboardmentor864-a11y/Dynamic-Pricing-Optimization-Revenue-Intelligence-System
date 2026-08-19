import CSVUploader from "../components/CSVUploader";

export default function UploadDataset() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 flex items-center justify-center p-8">

      <div className="max-w-3xl w-full">

        <div className="text-center mb-10">

          <h1 className="text-5xl font-bold text-gray-900">
            PricePilot AI
          </h1>

          <p className="text-gray-500 mt-3 text-lg">
            Upload your product dataset to start AI analysis.
          </p>

        </div>

        <CSVUploader />

      </div>

    </div>
  );
}