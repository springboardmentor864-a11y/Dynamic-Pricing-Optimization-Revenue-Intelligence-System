import { useRef } from "react";
import { UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";
import { useData } from "../context/DataContext";
import { addActivityLog } from "../utils/activityLogger";

export default function CSVUploader() {

  const inputRef = useRef();

  const navigate = useNavigate();

  const {
    setProducts,
    setPreview,
    setColumns,
    setDatasetInfo,
    setFileName,
    setLoading,
    setIsDataLoaded,
    setStats,
    startUploadStatusPolling,
    clearData,
    setError,
  } = useData();

  const uploadFile = async (file) => {
    if (!file) return;

    clearData();
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const res = await api.post(
        "/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.status === "processing") {
        startUploadStatusPolling(res.data.file_hash);
        navigate("/dashboard");
      } else {
        // Cache Hit
        setProducts(res.data.products || []);
        setPreview(res.data.preview || []);
        setColumns(res.data.columns || []);
        setDatasetInfo(res.data);
        setFileName(res.data.filename);
        setStats(res.data.stats || {});
        setIsDataLoaded(true);
        addActivityLog("Dataset Loaded", `Loaded dataset ${res.data.filename} from cache.`, "download");
        toast.success("Dataset Loaded Successfully");
        navigate("/dashboard");
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.detail || "Upload Failed");
      setLoading(false);
    }
  };

  return (

    <div className="bg-white rounded-3xl shadow-xl border p-10">

      <input
        hidden
        ref={inputRef}
        type="file"
        accept=".csv, .xlsx, .xls"
        onChange={(e) =>
          uploadFile(e.target.files[0])
        }
      />

      <div
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed border-blue-300 rounded-3xl p-16 text-center cursor-pointer hover:border-blue-600 transition"
      >

        <UploadCloud
          size={70}
          className="mx-auto text-blue-600"
        />

        <h2 className="text-3xl font-bold mt-6">
          Upload Dataset
        </h2>

        <p className="text-gray-500 mt-3">
          Click to upload a CSV or Excel file
        </p>

        <button
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl"
        >
          Browse Files
        </button>

      </div>

    </div>

  );

}