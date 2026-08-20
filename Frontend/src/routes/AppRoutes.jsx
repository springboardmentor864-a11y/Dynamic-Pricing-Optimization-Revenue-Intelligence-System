import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/home/Home";
import Login from "../pages/login/Login";

import Dashboard from "../pages/dashboard/Dashboard";
import Product from "../pages/products/Product";
import Sales from "../pages/sales/Sales";
import Competitors from "../pages/competitors/Competitors";
import PriceHistory from "../pages/priceHistory/PriceHistory";
import Prediction from "../pages/prediction/Prediction";
import PredictionHistory from "../pages/predictionHistory/PredictionHistory";
import Forecast from "../pages/forecast/Forecast";
import Pricing from "../pages/pricing/Pricing";
import Analytics from "../pages/analytics/Analytics";

import MainLayout from "../layouts/MainLayout";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Marketing & Auth pages */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Login />} />

                {/* Application Core Modules with Modern Sidebar */}
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Product />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/competitors" element={<Competitors />} />
                    <Route path="/price-history" element={<PriceHistory />} />
                    <Route path="/prediction" element={<Prediction />} />
                    <Route path="/predict" element={<Prediction />} />
                    <Route path="/prediction-history" element={<PredictionHistory />} />
                    <Route path="/forecast" element={<Forecast />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/analytics" element={<Analytics />} />
                </Route>

                {/* Fallback */}
                <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;