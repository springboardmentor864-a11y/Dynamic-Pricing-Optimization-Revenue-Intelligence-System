/* PricePilot AI — REST API Client & JWT Auth Manager */
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('access_token');
  },

  setTokens(access, refresh, user) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  async request(endpoint, method = 'GET', data = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || `HTTP error! status: ${response.status}`);
      }

      return resData;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth endpoints
  async login(email, password) {
    const res = await this.request('/auth/login', 'POST', { email, password });
    if (res.access_token) {
      this.setTokens(res.access_token, res.refresh_token, res.user);
    }
    return res;
  },

  async register(name, email, password, role) {
    const res = await this.request('/auth/register', 'POST', { name, email, password, role });
    if (res.access_token) {
      this.setTokens(res.access_token, res.refresh_token, res.user);
    }
    return res;
  },

  async logout() {
    try {
      await this.request('/auth/logout', 'POST');
    } catch (e) {}
    this.clearTokens();
  },

  // Pricing endpoints
  async predictPrice(featureData) {
    return await this.request('/pricing/predict-price', 'POST', featureData);
  },

  async forecastDemand(productId, days) {
    return await this.request('/pricing/forecast-demand', 'POST', { product_id: productId, days });
  },

  async optimizePrice(currentPrice, cost) {
    return await this.request('/pricing/optimize-price', 'POST', { current_price: currentPrice, cost });
  },

  buildQueryString(filters) {
    if (!filters) return '';
    const params = new URLSearchParams();
    if (filters.range && filters.range !== 'all') params.append('range', filters.range);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.state && filters.state !== 'all') params.append('state', filters.state);
    if (filters.payment && filters.payment !== 'all') params.append('payment', filters.payment);
    const str = params.toString();
    return str ? `?${str}` : '';
  },

  // Dashboard endpoints
  async getSummary(filters = null) {
    return await this.request('/dashboard/summary' + this.buildQueryString(filters));
  },

  async getMonthlyRevenue(filters = null) {
    return await this.request('/dashboard/monthly-revenue' + this.buildQueryString(filters));
  },

  async getWeeklyRevenue(filters = null) {
    return await this.request('/dashboard/weekly-revenue' + this.buildQueryString(filters));
  },

  async getProfitMarginTrend(filters = null) {
    return await this.request('/dashboard/profit-margin' + this.buildQueryString(filters));
  },

  async getTopProducts() {
    return await this.request('/dashboard/top-products');
  },

  async getTopSellers() {
    return await this.request('/dashboard/top-sellers');
  },

  async getCustomerInsights(filters = null) {
    return await this.request('/dashboard/customer-insights' + this.buildQueryString(filters));
  },

  async getAuditLogs(page = 1) {
    return await this.request(`/admin/audit-logs?page=${page}`);
  },

  // Analytics
  async getFeatureImportance() {
    return await this.request('/analytics/feature-importance');
  },

  async getModelPerformance() {
    return await this.request('/analytics/model-performance');
  },

  // Products CRUD
  async getProducts(page = 1, search = '') {
    return await this.request(`/products?page=${page}&search=${encodeURIComponent(search)}`);
  },

  async createProduct(productData) {
    return await this.request('/products', 'POST', productData);
  },

  async updateProduct(id, productData) {
    return await this.request(`/products/${id}`, 'PUT', productData);
  },

  async deleteProduct(id) {
    return await this.request(`/products/${id}`, 'DELETE');
  },

  // Competitor Monitoring & Price Comparison APIs
  async getCompetitors() {
    return await this.request('/competitors');
  },

  async createCompetitor(data) {
    return await this.request('/competitors', 'POST', data);
  },

  async updateCompetitor(id, data) {
    return await this.request(`/competitors/${id}`, 'PUT', data);
  },

  async deleteCompetitor(id) {
    return await this.request(`/competitors/${id}`, 'DELETE');
  },

  async getCompetitorProducts(competitorId = null) {
    const q = competitorId ? `?competitor_id=${competitorId}` : '';
    return await this.request(`/competitors/products${q}`);
  },

  async ingestCompetitorPrice(priceData) {
    return await this.request('/competitors/prices', 'POST', priceData);
  },

  async importCompetitorCSV(formData) {
    const token = this.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}/competitors/import/csv`, {
      method: 'POST',
      headers,
      body: formData
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'CSV import failed');
    return resData;
  },

  async getCompetitorComparison(params = {}) {
    const q = new URLSearchParams();
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.position && params.position !== 'all') q.append('position', params.position);
    if (params.search) q.append('search', params.search);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset !== undefined) q.append('offset', params.offset);
    const str = q.toString();
    return await this.request(`/competitors/comparison${str ? '?' + str : ''}`);
  },

  async getCompetitorPriceHistory(params = {}) {
    const q = new URLSearchParams();
    if (params.competitor_product_id) q.append('competitor_product_id', params.competitor_product_id);
    if (params.product_sku) q.append('product_sku', params.product_sku);
    if (params.limit) q.append('limit', params.limit);
    const str = q.toString();
    return await this.request(`/competitors/prices/history${str ? '?' + str : ''}`);
  },

  exportCompetitorReportUrl(format = 'csv', params = {}) {
    const q = new URLSearchParams({ format });
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.position && params.position !== 'all') q.append('position', params.position);
    if (params.search) q.append('search', params.search);
    return `${this.baseUrl}/competitors/reports/export?${q.toString()}`;
  },

  // Market Intelligence & Business Intelligence APIs
  async getMarketOverview(params = {}) {
    const q = new URLSearchParams();
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.position && params.position !== 'all') q.append('position', params.position);
    if (params.risk && params.risk !== 'all') q.append('risk', params.risk);
    const str = q.toString();
    return await this.request(`/market/overview${str ? '?' + str : ''}`);
  },

  async getMarketTrends(params = {}) {
    const q = new URLSearchParams();
    if (params.limit) q.append('limit', params.limit);
    if (params.search) q.append('search', params.search);
    if (params.days) q.append('days', params.days);
    const str = q.toString();
    return await this.request(`/market/trends${str ? '?' + str : ''}`);
  },

  async getMarketOpportunities(params = {}) {
    const q = new URLSearchParams();
    if (params.type && params.type !== 'all') q.append('type', params.type);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset !== undefined) q.append('offset', params.offset);
    const str = q.toString();
    return await this.request(`/market/opportunities${str ? '?' + str : ''}`);
  },

  async getMarketPositioning() {
    return await this.request('/market/positioning');
  },

  async getMarketVolatility() {
    return await this.request('/market/volatility');
  },

  async getProductMarketIntelligence(productId) {
    return await this.request(`/market/product/${productId}`);
  },

  // Revenue Optimization & Pricing Strategy Engine APIs
  async getRevenueOverview(params = {}) {
    const q = new URLSearchParams();
    if (params.category_id) q.append('category_id', params.category_id);
    const str = q.toString();
    return await this.request(`/revenue/overview${str ? '?' + str : ''}`);
  },

  async getRevenueProfitability(params = {}) {
    const q = new URLSearchParams();
    if (params.category_id) q.append('category_id', params.category_id);
    const str = q.toString();
    return await this.request(`/revenue/profitability${str ? '?' + str : ''}`);
  },

  async getRevenueRecommendations(params = {}) {
    const q = new URLSearchParams();
    if (params.strategy && params.strategy !== 'all') q.append('strategy', params.strategy);
    if (params.risk && params.risk !== 'all') q.append('risk', params.risk);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset !== undefined) q.append('offset', params.offset);
    const str = q.toString();
    return await this.request(`/revenue/recommendations${str ? '?' + str : ''}`);
  },

  async getRevenueSimulationBaseline(params = {}) {
    const q = new URLSearchParams();
    if (params.price_change_pct) q.append('price_change_pct', params.price_change_pct);
    if (params.cost_change_pct) q.append('cost_change_pct', params.cost_change_pct);
    if (params.demand_multiplier) q.append('demand_multiplier', params.demand_multiplier);
    const str = q.toString();
    return await this.request(`/revenue/simulation${str ? '?' + str : ''}`);
  },

  async runRevenueSimulation(simulationData) {
    return await this.request('/revenue/simulate', 'POST', simulationData);
  },

  async getProductRevenueProfile(productId) {
    return await this.request(`/revenue/product/${productId}`);
  },

  // Executive BI, Reports, Alerts, & System Monitoring APIs
  async getExecutiveOverview(params = {}) {
    const q = new URLSearchParams();
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.risk && params.risk !== 'all') q.append('risk', params.risk);
    if (params.strategy && params.strategy !== 'all') q.append('strategy', params.strategy);
    const str = q.toString();
    return await this.request(`/bi/overview${str ? '?' + str : ''}`);
  },

  async getExecutiveDrilldown(params = {}) {
    const q = new URLSearchParams();
    if (params.dimension) q.append('dimension', params.dimension);
    if (params.parent_id) q.append('parent_id', params.parent_id);
    const str = q.toString();
    return await this.request(`/bi/drilldown${str ? '?' + str : ''}`);
  },

  getExecutiveReportDownloadUrl(reportType = 'Executive Summary', format = 'pdf', categoryId = null) {
    const q = new URLSearchParams({ report_type: reportType, format });
    if (categoryId) q.append('category_id', categoryId);
    return `${this.baseUrl}/reports/export?${q.toString()}`;
  },

  async getActiveAlerts() {
    return await this.request('/alerts');
  },

  async acknowledgeAlert(alertId) {
    return await this.request('/alerts/acknowledge', 'POST', { alert_id: alertId });
  },

  async getSystemHealth() {
    return await this.request('/monitoring/health');
  }
};
