# Price Intelligence Hub

{

  "project_name": "PricePilot - Dynamic Pricing Optimization & Revenue Intelligence System",

  "framework": "React",

  "build_tool": "Vite",

  "language": "JavaScript",

  "styling": "Tailwind CSS",

  "routing": "React Router DOM",

  "http_client": "Axios",

  "chart_library": "Recharts",

  "icon_library": "React Icons",

  "description": "Create a modern, responsive React dashboard frontend for an AI-powered Dynamic Pricing Optimization & Revenue Intelligence System. The frontend should communicate with a FastAPI backend using Axios. The UI should be clean, minimal, and professional, similar to Stripe, Vercel, or Linear dashboards.",

  "backend": {

    "base_url": "http://127.0.0.1:8000",

    "apis": [

      {

        "endpoint": "/products",

        "method": "GET",

        "description": "Returns all products."

      },

      {

        "endpoint": "/forecast",

        "method": "GET",

        "description": "Returns demand forecast data."

      },

      {

        "endpoint": "/recommendations",

        "method": "GET",

        "description": "Returns AI-generated pricing recommendations."

      }

    ]

  },

  "theme": {

    "primary": "#2563EB",

    "secondary": "#0F172A",

    "success": "#22C55E",

    "danger": "#EF4444",

    "background": "#F8FAFC",

    "card": "#FFFFFF"

  },

  "pages": [

    {

      "name": "Dashboard",

      "route": "/",

      "features": [

        "Statistics cards",

        "Revenue trend line chart",

        "Demand forecast chart",

        "Latest AI recommendations table",

        "Top products table"

      ]

    },

    {

      "name": "Products",

      "route": "/products",

      "features": [

        "Search products",

        "Filter products",

        "Sortable table",

        "Current price",

        "Stock",

        "Category"

      ]

    },

    {

      "name": "Forecast",

      "route": "/forecast",

      "features": [

        "Demand cards",

        "Forecast chart",

        "Forecast history table"

      ]

    },

    {

      "name": "Recommendations",

      "route": "/recommendations",

      "features": [

        "Current price",

        "Recommended price",

        "Expected revenue gain",

        "Recommendation status badges"

      ]

    },

    {

      "name": "Settings",

      "route": "/settings",

      "features": [

        "Dark mode toggle",

        "Backend URL",

        "Refresh interval",

        "Profile information"

      ]

    }

  ],

  "layout": {

    "navbar": {

      "items": [

        "Logo",

        "Search",

        "Notifications",

        "Profile"

      ]

    },

    "sidebar": {

      "items": [

        "Dashboard",

        "Products",

        "Forecast",

        "Recommendations",

        "Settings"

      ]

    }

  },

  "folder_structure": {

    "src": {

      "assets": [

        "logo.png",

        "icons/"

      ],

      "components": [

        "Navbar.jsx",

        "Sidebar.jsx",

        "StatCard.jsx",

        "ProductTable.jsx",

        "ForecastChart.jsx",

        "RecommendationTable.jsx",

        "Loader.jsx",

        "SearchBar.jsx",

        "PageHeader.jsx"

      ],

      "layouts": [

        "MainLayout.jsx"

      ],

      "pages": [

        "Dashboard.jsx",

        "Products.jsx",

        "Forecast.jsx",

        "Recommendations.jsx",

        "Settings.jsx"

      ],

      "services": [

        "api.js"

      ],

      "hooks": [

        "useProducts.js",

        "useForecast.js",

        "useRecommendations.js"

      ],

      "styles": [

        "App.css",

        "Dashboard.css",

        "Navbar.css",

        "Sidebar.css",

        "Tables.css"

      ],

      "utils": [

        "constants.js",

        "helpers.js"

      ],

      "App.jsx": {},

      "main.jsx": {},

      "routes.jsx": {}

    }

  },

  "components": {

    "Navbar": {

      "features": [

        "Logo",

        "Search bar",

        "Notification icon",

        "Profile avatar"

      ]

    },

    "Sidebar": {

      "features": [

        "Navigation menu",

        "Active route highlighting"

      ]

    },

    "StatCard": {

      "features": [

        "Title",

        "Value",

        "Trend percentage",

        "Icon"

      ]

    },

    "ForecastChart": {

      "type": "LineChart",

      "library": "Recharts"

    },

    "ProductTable": {

      "columns": [

        "ID",

        "Product",

        "Price",

        "Stock",

        "Category",

        "Action"

      ]

    },

    "RecommendationTable": {

      "columns": [

        "Product",

        "Current Price",

        "Suggested Price",

        "Revenue Gain",

        "Status"

      ]

    }

  },

  "generated_files": [

    "src/main.jsx",

    "src/App.jsx",

    "src/routes.jsx",

    "src/services/api.js",

    "src/layouts/MainLayout.jsx",

    "src/pages/Dashboard.jsx",

    "src/pages/Products.jsx",

    "src/pages/Forecast.jsx",

    "src/pages/Recommendations.jsx",

    "src/pages/Settings.jsx",

    "src/components/Navbar.jsx",

    "src/components/Sidebar.jsx",

    "src/components/StatCard.jsx",

    "src/components/ProductTable.jsx",

    "src/components/ForecastChart.jsx",

    "src/components/RecommendationTable.jsx",

    "src/components/PageHeader.jsx",

    "src/components/SearchBar.jsx",

    "src/components/Loader.jsx",

    "src/hooks/useProducts.js",

    "src/hooks/useForecast.js",

    "src/hooks/useRecommendations.js",

    "src/utils/constants.js",

    "src/utils/helpers.js",

    "src/styles/App.css",

    "src/styles/Dashboard.css",

    "src/styles/Navbar.css",

    "src/styles/Sidebar.css",

    "src/styles/Tables.css"

  ],

  "requirements": [

    "Use functional React components.",

    "Use React Hooks only.",

    "Use React Router for navigation.",

    "Use Axios for all API requests.",

    "Use reusable components.",

    "Keep components modular.",

    "Show loading spinner while fetching data.",

    "Handle API errors gracefully.",

    "Make the dashboard fully responsive.",

    "Use Tailwind CSS for styling.",

    "Write clean, maintainable code.",

    "Include comments where appropriate.",

    "Use dummy data when API is unavailable.",

    "Ensure the UI is modern and professional."

  ],

  "expected_result": "Generate a complete production-ready React frontend with all listed files, folder structure, responsive design, reusable components, API integration, charts, tables, navigation, and clean architecture."

}

"just give these particular files only dont add any other files"

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a32e7cdc-354c-4fca-b9eb-5033d5d5315a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
