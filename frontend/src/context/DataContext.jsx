import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [preview, setPreview] = useState([]);
  const [columns, setColumns] = useState([]);

  const [datasetInfo, setDatasetInfo] = useState({});
  const [cleaningReport, setCleaningReport] = useState(null);

  const [fileName, setFileName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Status and progress of background task
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);

  const [datasets, setDatasets] = useState([]);
  const [activeDatasetHash, setActiveDatasetHash] = useState("");

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRevenue: 0,
    totalSales: 0,
    averagePrice: 0,
    lowestPrice: 0,
    highestPrice: 0,
    averageRevenue: 0,
    profit: 0,
    inventoryValue: 0,
    priceChanges: 0,
    lowStock: 0,
    competitorAlerts: 0,
    predictionAccuracy: 0,
    forecastAccuracy: 0
  });

  const [recommendations, setRecommendations] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [assistantResponse, setAssistantResponse] = useState("");

  const [predictedPrice, setPredictedPrice] = useState(null);
  const [forecast, setForecast] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState("");

  // Theme states
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Notifications states
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications_feed");
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        title: "Welcome to PricePilot AI",
        message: "Your account is secure. Upload your first dataset to begin AI price optimizations.",
        time: "Just now",
        read: false
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("notifications_feed", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (title, message) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        title,
        message,
        time: "Just now",
        read: false
      },
      ...prev
    ]);
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const fetchProducts = async (page = 1, limit = 25, search = "", category = "All", sort = "default") => {
    try {
      setLoading(true);
      const res = await api.get("/products", {
        params: { page, limit, search, category, sort }
      });
      if (res.data && res.data.status === "success") {
        setError(null);
        setProducts(res.data.products || []);
        setTotalCount(res.data.totalCount || 0);
        setCategories(res.data.categories || []);
        setStats(res.data.stats || {});
        setFileName(res.data.filename || "");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 404) {
        setError("Failed to fetch product catalog.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startUploadStatusPolling = (fileHash) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/upload/status/${fileHash}`);
        if (res.data) {
          const { status, progress, error_message, preview, columns, stats, cleaningReport, filename, rows } = res.data;
          setUploadProgress(progress);
          setProcessingStatus(status);

          if (status === "Completed") {
            clearInterval(interval);
            setUploadProgress(100);
            setProcessingStatus("Completed");

            if (cleaningReport) setCleaningReport(cleaningReport);
            if (columns) setColumns(columns);
            if (stats) setStats(stats);
            if (filename) setFileName(filename);

            await fetchInitialData();

            setLoading(false);
            setIsDataLoaded(true);

            toast.success("Dataset cleaned and models trained successfully!");
          } else if (status === "Failed") {
            clearInterval(interval);
            setError(error_message || "Dataset processing failed.");
            setLoading(false);
            toast.error("Dataset processing failed.");
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 1500);
  };

  const fetchDatasets = async () => {
    try {
      const res = await api.get("/datasets");
      setDatasets(res.data || []);
      
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        setActiveDatasetHash(u.active_dataset_hash || "");
      }
    } catch (e) {
      console.error("Failed to load datasets", e);
    }
  };

  const selectDataset = async (hash) => {
    try {
      setLoading(true);
      const res = await api.post("/datasets/select", { file_hash: hash });
      if (res.data && res.data.status === "success") {
        setActiveDatasetHash(hash);
        
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        const userStr = storage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userObj.active_dataset_hash = hash;
          storage.setItem("user", JSON.stringify(userObj));
          window.dispatchEvent(new Event("storage"));
        }
        
        toast.success(`Active workspace updated successfully!`);
        await fetchInitialData();
      }
    } catch (e) {
      console.error("Failed to select dataset", e);
      toast.error("Failed to select workspace");
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      
      await fetchDatasets();

      const res = await api.get("/products");
      if (res.data && res.data.status === "success") {
        setProducts(res.data.products || []);
        setPreview(res.data.preview || []);
        setColumns(res.data.columns || []);
        setDatasetInfo(res.data);
        if (res.data.cleaningReport) setCleaningReport(res.data.cleaningReport);
        setFileName(res.data.filename || "");
        setStats(res.data.stats || {});
        setCategories(res.data.categories || []);
        setTotalCount(res.data.totalCount || 0);
        setIsDataLoaded(true);

        try {
          const recsRes = await api.get("/recommendations");
          setRecommendations(recsRes.data || []);
        } catch (e) {
          console.log("Failed to fetch recommendations", e);
        }

        try {
          const anomsRes = await api.get("/anomalies");
          setAnomalies(anomsRes.data || []);
        } catch (e) {
          console.log("Failed to fetch anomalies", e);
        }
      }
    } catch (err) {
      console.log("No initial dataset loaded", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const clearData = () => {
    setProducts([]);
    setPreview([]);
    setColumns([]);
    setDatasetInfo({});
    setCleaningReport(null);
    setFileName("");
    setIsDataLoaded(false);
    setStats({
      totalProducts: 0,
      totalRevenue: 0,
      totalSales: 0,
      averagePrice: 0,
      lowestPrice: 0,
      highestPrice: 0,
      averageRevenue: 0,
      profit: 0,
      inventoryValue: 0,
      priceChanges: 0,
      lowStock: 0,
      competitorAlerts: 0,
      predictionAccuracy: 0,
      forecastAccuracy: 0
    });
    setRecommendations([]);
    setAnomalies([]);
  };

  return (
    <DataContext.Provider
      value={{
        products,
        setProducts,
        preview,
        setPreview,
        columns,
        setColumns,
        datasetInfo,
        setDatasetInfo,
        cleaningReport,
        setCleaningReport,
        fileName,
        setFileName,
        loading,
        setLoading,
        error,
        setError,
        isDataLoaded,
        setIsDataLoaded,
        stats,
        setStats,
        recommendations,
        setRecommendations,
        anomalies,
        setAnomalies,
        assistantResponse,
        setAssistantResponse,
        predictedPrice,
        setPredictedPrice,
        forecast,
        setForecast,
        selectedProduct,
        setSelectedProduct,
        clearData,
        darkMode,
        setDarkMode,
        uploadProgress,
        setUploadProgress,
        processingStatus,
        setProcessingStatus,
        totalCount,
        setTotalCount,
        categories,
        setCategories,
        fetchProducts,
        startUploadStatusPolling,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        addNotification,
        fetchInitialData,
        datasets,
        activeDatasetHash,
        selectDataset,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}