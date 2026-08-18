/* PricePilot AI — Luxury Interactive ApexCharts Engine */
const ChartsEngine = {
  chartInstances: {},

  initSparkline(containerId, data, color = '#6366f1') {
    const options = {
      chart: {
        type: 'area',
        height: 32,
        sparkline: { enabled: true },
        background: 'transparent'
      },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 }
      },
      colors: [color],
      series: [{ name: 'Metric Trend', data }],
      tooltip: { enabled: false },
      dataLabels: { enabled: false }
    };
    this.renderOrUpdate(containerId, containerId, options);
  },

  initMonthlyRevenueChart(containerId, monthlyData) {
    const options = {
      chart: {
        type: 'area',
        height: 340,
        toolbar: {
          show: true,
          tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true }
        },
        background: 'transparent',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      theme: { mode: 'dark' },
      colors: ['#6366f1', '#a855f7'],
      stroke: { curve: 'smooth', width: 2.5 },
      dataLabels: { enabled: false }, // CRITICAL FIX: Hide overlapping point text labels
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.40,
          opacityTo: 0.03,
          stops: [0, 95, 100]
        }
      },
      xaxis: {
        categories: monthlyData.labels,
        labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: true, stroke: { color: '#6366f1', dashArray: 4 } }
      },
      yaxis: {
        labels: {
          style: { colors: '#94a3b8', fontSize: '11px' },
          formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`
        }
      },
      series: monthlyData.series,
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#94a3b8' } },
      tooltip: {
        shared: true,
        intersect: false,
        theme: 'dark',
        y: {
          formatter: (val) => `R$ ${val ? val.toLocaleString() : '0'}`
        }
      }
    };
    this.renderOrUpdate('monthlyRevenue', containerId, options);
  },

  initWeeklyRevenueChart(containerId, weeklyData) {
    const options = {
      chart: {
        type: 'bar',
        height: 340,
        toolbar: {
          show: true,
          tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true }
        },
        background: 'transparent',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      theme: { mode: 'dark' },
      colors: ['#10b981', '#06b6d4'],
      dataLabels: { enabled: false }, // CRITICAL FIX: Hide overlapping point text labels
      xaxis: {
        categories: weeklyData.labels,
        labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 } },
        axisBorder: { show: false }
      },
      yaxis: [
        { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k` } },
        { opposite: true, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } }
      ],
      series: weeklyData.series,
      plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#94a3b8' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('weeklyRevenue', containerId, options);
  },

  initCustomerStateChart(containerId, insights) {
    const options = {
      chart: { type: 'donut', height: 300, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      labels: insights.customers_by_state.labels,
      series: insights.customers_by_state.data,
      colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#64748b'],
      stroke: { width: 0 },
      dataLabels: { enabled: false }, // CRITICAL FIX: Clean legend tooltips
      legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('customerState', containerId, options);
  },

  initFeatureImportanceChart(containerId, fiData) {
    const options = {
      chart: { type: 'bar', height: 300, toolbar: { show: true }, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      colors: ['#6366f1'],
      dataLabels: { enabled: false }, // CRITICAL FIX: Hide overlapping point text labels
      plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '55%' } },
      xaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
      yaxis: { categories: fiData.features, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
      series: [{ name: 'Importance Score', data: fiData.composite_score }],
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('featureImportance', containerId, options);
  },

  initDemandForecastChart(containerId, forecastData) {
    if (!forecastData || !forecastData.daily_forecast) return;

    const dates = forecastData.daily_forecast.map(d => d.date || `Day ${d.day}`);
    const forecast = forecastData.daily_forecast.map(d => d.forecasted_demand);
    const upperBound = forecastData.daily_forecast.map(d => d.upper_bound);
    const lowerBound = forecastData.daily_forecast.map(d => d.lower_bound);

    const options = {
      chart: {
        type: 'line',
        height: 340,
        toolbar: { show: true },
        background: 'transparent',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      theme: { mode: 'dark' },
      colors: ['#6366f1', '#10b981', '#ef4444'],
      stroke: { curve: 'smooth', width: [3, 1.5, 1.5], dashArray: [0, 4, 4] },
      dataLabels: { enabled: false },
      series: [
        { name: 'Projected Demand (Units)', data: forecast },
        { name: 'Upper Bound (95% CI)', data: upperBound },
        { name: 'Lower Bound (95% CI)', data: lowerBound }
      ],
      xaxis: { categories: dates, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
      yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      legend: { position: 'top', labels: { colors: '#94a3b8' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('demandForecast', containerId, options);
  },

  initPriceElasticityChart(containerId, elasticityData) {
    if (!elasticityData || !elasticityData.elasticity_curve) return;

    const prices = elasticityData.elasticity_curve.map(d => `R$ ${d.price.toFixed(2)}`);
    const demand = elasticityData.elasticity_curve.map(d => d.projected_demand);
    const profit = elasticityData.elasticity_curve.map(d => d.projected_profit);

    const options = {
      chart: {
        type: 'line',
        height: 320,
        toolbar: { show: true },
        background: 'transparent',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      theme: { mode: 'dark' },
      colors: ['#10b981', '#a855f7'],
      stroke: { curve: 'smooth', width: [3, 2] },
      dataLabels: { enabled: false },
      series: [
        { name: 'Projected Profit (BRL)', data: profit },
        { name: 'Expected Demand (Units)', data: demand }
      ],
      xaxis: { categories: prices, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
      yaxis: [
        { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v) => `R$ ${v}` } },
        { opposite: true, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } }
      ],
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      legend: { position: 'top', labels: { colors: '#94a3b8' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('priceElasticity', containerId, options);
  },

  initCompetitorPositionChart(containerId, positionCounts) {
    if (!positionCounts) return;
    const labels = ['Lowest', 'Competitive', 'Premium', 'Overpriced', 'Unmapped'];
    const series = [
      positionCounts['Lowest'] || 0,
      positionCounts['Competitive'] || 0,
      positionCounts['Premium'] || 0,
      positionCounts['Overpriced'] || 0,
      positionCounts['Unmapped'] || 0
    ];

    const options = {
      chart: { type: 'donut', height: 260, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      labels: labels,
      series: series,
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'],
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', labels: { colors: '#94a3b8', fontSize: '11px' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('competitorPosition', containerId, options);
  },

  initRollingAverageChart(containerId, trendsData) {
    if (!trendsData || !trendsData.trends) return;
    const skus = trendsData.trends.map(t => t.product_id);
    const rolling7 = trendsData.trends.map(t => t.rolling_7d_avg || t.current_price);
    const rolling14 = trendsData.trends.map(t => t.rolling_14d_avg || t.current_price);
    const rolling30 = trendsData.trends.map(t => t.rolling_30d_avg || t.current_price);

    const options = {
      chart: { type: 'line', height: 300, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      colors: ['#6366f1', '#10b981', '#f59e0b'],
      stroke: { curve: 'smooth', width: [3, 2, 2], dashArray: [0, 3, 5] },
      dataLabels: { enabled: false },
      series: [
        { name: '7-Day Rolling Avg', data: rolling7 },
        { name: '14-Day Rolling Avg', data: rolling14 },
        { name: '30-Day Rolling Avg', data: rolling30 }
      ],
      xaxis: { categories: skus, labels: { style: { colors: '#94a3b8', fontSize: '10px' } } },
      yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v) => `R$ ${v.toFixed(0)}` } },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      legend: { position: 'top', labels: { colors: '#94a3b8' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('rollingAverage', containerId, options);
  },

  initMarketTrendChart(containerId, directionCounts) {
    if (!directionCounts) return;
    const labels = ['Increasing', 'Stable', 'Decreasing', 'Highly Volatile'];
    const series = [
      directionCounts['Increasing'] || 0,
      directionCounts['Stable'] || 0,
      directionCounts['Decreasing'] || 0,
      directionCounts['Highly Volatile'] || 0
    ];

    const options = {
      chart: { type: 'bar', height: 260, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      plotOptions: { bar: { borderRadius: 6, distributed: true, columnWidth: '50%' } },
      dataLabels: { enabled: false },
      series: [{ name: 'Products Count', data: series }],
      xaxis: { categories: labels, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
      yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      legend: { show: false },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('marketTrend', containerId, options);
  },

  initRevenueProfitTrendChart(containerId, overviewData) {
    if (!overviewData || !overviewData.products) return;
    const items = overviewData.products.slice(0, 12);
    const skus = items.map(i => i.product_id);
    const currentRev = items.map(i => i.current_revenue);
    const projRev = items.map(i => i.projected_revenue);
    const projProf = items.map(i => i.projected_profit);

    const options = {
      chart: { type: 'bar', height: 300, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      colors: ['#64748b', '#6366f1', '#10b981'],
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      series: [
        { name: 'Current Revenue', data: currentRev },
        { name: 'Projected Revenue', data: projRev },
        { name: 'Projected Profit', data: projProf }
      ],
      xaxis: { categories: skus, labels: { style: { colors: '#94a3b8', fontSize: '10px' } } },
      yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v) => `R$ ${(v/1000).toFixed(1)}k` } },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      legend: { position: 'top', labels: { colors: '#94a3b8' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('revenueProfitTrend', containerId, options);
  },

  initScenarioSensitivityChart(containerId, sensitivityCurve) {
    if (!sensitivityCurve || sensitivityCurve.length === 0) return;
    const prices = sensitivityCurve.map(s => `R$ ${s.simulated_price.toFixed(0)} (${s.price_change_pct > 0 ? '+' : ''}${s.price_change_pct}%)`);
    const profits = sensitivityCurve.map(s => s.projected_profit);
    const revenues = sensitivityCurve.map(s => s.projected_revenue);

    const options = {
      chart: { type: 'line', height: 300, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      colors: ['#10b981', '#6366f1'],
      stroke: { curve: 'smooth', width: [3, 2] },
      dataLabels: { enabled: false },
      series: [
        { name: 'Projected Net Profit', data: profits },
        { name: 'Projected Gross Revenue', data: revenues }
      ],
      xaxis: { categories: prices, labels: { style: { colors: '#94a3b8', fontSize: '10px' } } },
      yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v) => `R$ ${v.toFixed(0)}` } },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      legend: { position: 'top', labels: { colors: '#94a3b8' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('scenarioSensitivity', containerId, options);
  },

  initPricingStrategyChart(containerId, strategyCounts) {
    if (!strategyCounts) return;
    const labels = Object.keys(strategyCounts);
    const series = Object.values(strategyCounts);

    const options = {
      chart: { type: 'donut', height: 260, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      labels: labels,
      series: series,
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#06b6d4', '#8b5cf6'],
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', labels: { colors: '#94a3b8', fontSize: '10px' } },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('pricingStrategyDist', containerId, options);
  },

  initExecWaterfallChart(containerId, kpis) {
    if (!kpis) return;
    const seriesData = [
      { x: 'Baseline Revenue', y: kpis.total_revenue },
      { x: 'Price Elasticity Gain', y: roundNum(kpis.potential_profit_lift * 0.45) },
      { x: 'Competitor Re-alignment', y: roundNum(kpis.potential_profit_lift * 0.35) },
      { x: 'Cost Optimization', y: roundNum(kpis.potential_profit_lift * 0.20) },
      { x: 'Optimized Revenue', y: kpis.projected_revenue }
    ];

    function roundNum(v) { return Math.round(v * 100) / 100; }

    const options = {
      chart: { type: 'bar', height: 280, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
      colors: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
      dataLabels: { enabled: false },
      series: [{ name: 'Financial Impact (R$)', data: seriesData }],
      xaxis: { type: 'category', labels: { style: { colors: '#94a3b8', fontSize: '10px' } } },
      yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v) => `R$ ${(v/1000).toFixed(1)}k` } },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('execWaterfall', containerId, options);
  },

  initExecTreemapChart(containerId, strategyCounts) {
    if (!strategyCounts) return;
    const seriesData = Object.keys(strategyCounts).map(k => ({
      x: k,
      y: strategyCounts[k] || 1
    }));

    const options = {
      chart: { type: 'treemap', height: 280, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#06b6d4', '#8b5cf6'],
      series: [{ data: seriesData }],
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('execTreemap', containerId, options);
  },

  initExecRadarChart(containerId, positionCounts) {
    if (!positionCounts) return;
    const categories = ['Market Leader', 'Aggressive Pricing', 'Below Market', 'At Market', 'Above Market', 'Premium'];
    const values = categories.map(c => positionCounts[c] || 0);

    const options = {
      chart: { type: 'radar', height: 280, background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
      theme: { mode: 'dark' },
      colors: ['#38bdf8'],
      markers: { size: 4 },
      series: [{ name: 'SKUs Count', data: values }],
      xaxis: { categories: categories, labels: { style: { colors: '#94a3b8', fontSize: '10px' } } },
      yaxis: { show: false },
      tooltip: { theme: 'dark' }
    };
    this.renderOrUpdate('execRadar', containerId, options);
  },

  renderOrUpdate(key, containerId, options) {
    if (this.chartInstances[key]) {
      this.chartInstances[key].destroy();
    }
    const el = document.getElementById(containerId);
    if (el) {
      this.chartInstances[key] = new ApexCharts(el, options);
      this.chartInstances[key].render();
    }
  }
};
