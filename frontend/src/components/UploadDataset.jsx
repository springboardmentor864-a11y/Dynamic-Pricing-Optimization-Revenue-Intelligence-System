import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";
import { useData } from "../context/DataContext";


export default function UploadDataset() {
  const inputRef = useRef();
  const navigate = useNavigate();

  const {
    setProducts,
    setPreview,
    setColumns,
    setDatasetInfo,
    setFileName,
    setStats,
    setLoading,
    setIsDataLoaded,
    setError,
    setCleaningReport,
    clearData,
    startUploadStatusPolling,
  } = useData();

  const upload = async (file) => {
    if (!file) return;

    const nameLower = file.name.toLowerCase();
    if (!(nameLower.endsWith(".csv") || nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls"))) {
      toast.error("Please upload a CSV or Excel file.");
      return;
    }

    clearData();
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.status === "processing") {
        startUploadStatusPolling(res.data.file_hash);
        navigate("/dashboard");
      } else {
        // Cache Hit
        setProducts(res.data.products || []);
        setPreview(res.data.preview || []);
        setColumns(res.data.columns || []);
        setDatasetInfo(res.data);
        setCleaningReport(res.data.cleaningReport || {});
        setFileName(res.data.filename || "");
        setStats(res.data.stats || {});
        setIsDataLoaded(true);
        toast.success("Dataset loaded from cache successfully!");
        navigate("/dashboard");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.detail || "Dataset upload failed.";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => inputRef.current.click()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
      >
        Upload CSV/Excel
      </button>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".csv, .xlsx, .xls"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      
    </div>
  );
}