import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pricepilot_prediction_history';

// Sample initial history records if empty
const sampleHistory = [
  {
    id: 'PRD-1092',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    category: 'Computers & Tech',
    weight: '1200g',
    freight: '$18.50',
    volume: '4500 cm³',
    predictedPrice: 245.50,
    confidence: '96.5%',
    model: 'Extra Trees',
    recommendation: 'Competitive Price — High Demand',
  },
  {
    id: 'PRD-1093',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    category: 'Furniture & Decor',
    weight: '8500g',
    freight: '$42.00',
    volume: '72000 cm³',
    predictedPrice: 480.00,
    confidence: '94.8%',
    model: 'Extra Trees',
    recommendation: 'Premium Surge Margin Recommended',
  },
  {
    id: 'PRD-1094',
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
    category: 'Health & Beauty',
    weight: '350g',
    freight: '$8.20',
    volume: '1200 cm³',
    predictedPrice: 89.90,
    confidence: '97.2%',
    model: 'Extra Trees',
    recommendation: 'Standard Market Price',
  },
];

export const usePredictionHistory = () => {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : sampleHistory;
    } catch {
      return sampleHistory;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save prediction history to localStorage', e);
    }
  }, [history]);

  const addPrediction = (predictionRecord) => {
    const newEntry = {
      id: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      ...predictionRecord,
    };
    setHistory((prev) => [newEntry, ...prev]);
  };

  const deletePrediction = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const exportToCSV = () => {
    if (history.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Category', 'Weight', 'Freight', 'Volume', 'PredictedPrice_INR', 'Confidence', 'Model', 'Recommendation'];
    const rows = history.map((item) => [
      item.id,
      item.timestamp,
      `"${item.category || 'General'}"`,
      item.weight || '',
      item.freight || '',
      item.volume || '',
      item.predictedPrice || '',
      item.confidence || '',
      item.model || 'Extra Trees',
      `"${item.recommendation || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PricePilot_Predictions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { history, addPrediction, deletePrediction, clearHistory, exportToCSV };
};

export default usePredictionHistory;
