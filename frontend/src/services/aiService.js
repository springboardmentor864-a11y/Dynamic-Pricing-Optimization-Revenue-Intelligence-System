import axios from 'axios';
import { getApiUrl } from '../config';

/**
 * Retrieves the authorization headers including the active session token.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('pricepilot_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Unpacks the response data, handling middleware wraps dynamically.
 */
const unpackResponse = (response) => {
  const payload = response.data;
  if (payload && payload.success !== undefined && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
};

/**
 * AI Chat interaction.
 */
export const chatWithAi = async (message, history = []) => {
  const response = await axios.post(
    getApiUrl('/api/ai/chat'),
    { message, history },
    { headers: getAuthHeaders() }
  );
  const data = unpackResponse(response);
  return data.reply;
};

/**
 * Explains a price prediction simulation in business terms.
 */
export const explainPricePrediction = async (priceData) => {
  const response = await axios.post(
    getApiUrl('/api/ai/explain-price'),
    {
      predicted_price: parseFloat(priceData.predicted_price),
      current_price: parseFloat(priceData.current_price),
      category: priceData.category,
      demand: priceData.demand || 'Medium',
      confidence: parseFloat(priceData.confidence || 80.0),
      model_used: priceData.model_used
    },
    { headers: getAuthHeaders() }
  );
  const data = unpackResponse(response);
  return data.explanation;
};

/**
 * Summarizes the dashboard KPIs.
 */
export const getDashboardSummary = async (stats) => {
  const response = await axios.post(
    getApiUrl('/api/ai/dashboard-summary'),
    { stats },
    { headers: getAuthHeaders() }
  );
  const data = unpackResponse(response);
  return data.summary;
};

/**
 * Surfs business alerts and restocking advice.
 */
export const getBusinessInsights = async (products) => {
  const response = await axios.post(
    getApiUrl('/api/ai/business-insights'),
    { products },
    { headers: getAuthHeaders() }
  );
  const data = unpackResponse(response);
  return data.insights;
};

/**
 * Interprets demand time-series forecasts.
 */
export const getForecastSummary = async (forecastData, modelUsed, growthPct) => {
  const response = await axios.post(
    getApiUrl('/api/ai/forecast-summary'),
    {
      forecast_data: forecastData,
      model_used: modelUsed,
      growth_pct: parseFloat(growthPct)
    },
    { headers: getAuthHeaders() }
  );
  const data = unpackResponse(response);
  return data.explanation;
};

/**
 * Compares validation metric benchmarks.
 */
export const getModelComparison = async (comparisonMetrics) => {
  const response = await axios.post(
    getApiUrl('/api/ai/model-comparison'),
    { comparison: comparisonMetrics },
    { headers: getAuthHeaders() }
  );
  const data = unpackResponse(response);
  return data.analysis;
};

// Exact method name exports requested by the user
export const chat = chatWithAi;
export const explainPrice = explainPricePrediction;
export const dashboardSummary = getDashboardSummary;
export const businessInsights = getBusinessInsights;
export const compareModels = getModelComparison;
export const forecastSummary = getForecastSummary;

