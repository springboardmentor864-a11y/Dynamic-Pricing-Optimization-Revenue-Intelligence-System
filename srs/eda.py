import logging
import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from tqdm import tqdm
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go
import missingno as msno
from ydata_profiling import ProfileReport

from src.config import PLOTS_DIR, REPORTS_DIR, TARGET_COLUMN

logger = logging.getLogger(__name__)

# Set plotting style for premium aesthetics
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 10,
    "axes.labelsize": 12,
    "axes.titlesize": 14,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "figure.titlesize": 16,
    "figure.dpi": 300
})

# Custom premium palette
PREMIUM_COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]

def run_eda_pipeline(df, raw_datasets=None):
    """
    Executes the exploratory data analysis pipeline, generating plots and reports.
    """
    try:
        logger.info("Starting EDA pipeline...")
        
        # 1. Dataset Overview
        logger.info("Generating dataset overview...")
        overview_text = f"Dataset Shape: {df.shape}\n"
        overview_text += f"Columns: {list(df.columns)}\n\n"
        overview_text += "Data Info:\n"
        import io
        buffer = io.StringIO()
        df.info(buf=buffer)
        overview_text += buffer.getvalue()
        
        with open(REPORTS_DIR / "dataset_overview.txt", "w") as f:
            f.write(overview_text)
        logger.info("Dataset overview report written to dataset_overview.txt")

        # 2. Missing Values Visualization
        if raw_datasets:
            logger.info("Generating missing values visualizations from raw datasets...")
            # We visualize missing values on orders dataset as it has missing timestamps
            plt.figure(figsize=(10, 6))
            msno.matrix(raw_datasets["olist_orders_dataset"], sparkline=False)
            plt.title("Missing Values Matrix (Orders Dataset)", fontsize=16, pad=20)
            plt.tight_layout()
            plt.savefig(PLOTS_DIR / "missing_values_matrix.png", dpi=300)
            plt.close()

        # 3. Correlation Heatmap of Numeric Features
        logger.info("Generating correlation heatmap...")
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        # Drop columns with zero variance or ID codes
        cols_to_exclude = ["customer_zip_code_prefix", "seller_zip_code_prefix", "payment_sequential"]
        numeric_cols = [c for c in numeric_cols if c not in cols_to_exclude]
        
        corr_matrix = df[numeric_cols].corr()
        plt.figure(figsize=(12, 10))
        sns.heatmap(corr_matrix, annot=False, cmap="coolwarm", fmt=".2f", linewidths=0.5)
        plt.title("Numerical Features Correlation Matrix", fontsize=16, pad=15)
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "correlation_heatmap.png", dpi=300)
        plt.close()
        
        # Save correlation matrix to CSV
        corr_matrix.to_csv(REPORTS_DIR / "correlation_matrix.csv")

        # 4. Downsample dataset for heavy plots (pairplots/KDEs)
        plot_sample = df.sample(min(5000, len(df)), random_state=42)

        # 5. Pairplot of key features
        logger.info("Generating pairplot...")
        pairplot_features = [TARGET_COLUMN, "total_freight_cost", "delivery_time", "avg_review_score"]
        g = sns.pairplot(plot_sample[pairplot_features], diag_kind="kde", 
                         plot_kws={"alpha": 0.4, "color": PREMIUM_COLORS[0]}, 
                         diag_kws={"color": PREMIUM_COLORS[0]})
        g.fig.suptitle("Pairplot of Key Numerical Features", y=1.02, fontsize=16)
        g.savefig(PLOTS_DIR / "pairplot.png", dpi=300)
        plt.close()

        # 6. Histograms & KDE plots of Revenue and Delivery Time
        logger.info("Generating distribution plots...")
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        
        # Target Variable Log-scale Histogram & KDE
        sns.histplot(df[TARGET_COLUMN], kde=True, ax=axes[0, 0], color=PREMIUM_COLORS[0], log_scale=True)
        axes[0, 0].set_title("Distribution of Total Order Value (Log Scale)")
        axes[0, 0].set_xlabel("Order Value (BRL)")
        
        # Delivery Time Histogram & KDE
        sns.histplot(df["delivery_time"], kde=True, ax=axes[0, 1], color=PREMIUM_COLORS[1])
        axes[0, 1].set_title("Distribution of Delivery Time (Days)")
        axes[0, 1].set_xlabel("Delivery Time (Days)")
        
        # Delivery Delay Histogram & KDE
        sns.histplot(df["delivery_delay"], kde=True, ax=axes[1, 0], color=PREMIUM_COLORS[2])
        axes[1, 0].set_title("Distribution of Delivery Delay (Days)")
        axes[1, 0].set_xlabel("Delivery Delay (Days, <0 is early)")
        
        # Average Product Price
        sns.histplot(df["avg_product_price"], kde=True, ax=axes[1, 1], color=PREMIUM_COLORS[3], log_scale=True)
        axes[1, 1].set_title("Distribution of Average Product Price (Log Scale)")
        axes[1, 1].set_xlabel("Average Product Price (BRL)")
        
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "distributions.png", dpi=300)
        plt.close()

        # 7. Boxplots & Violin plots (Review Score vs Revenue)
        logger.info("Generating boxplots and violin plots...")
        fig, axes = plt.subplots(1, 2, figsize=(15, 6))
        
        # Boxplot review score vs delivery time
        sns.boxplot(x="avg_review_score", y="delivery_time", data=df, ax=axes[0], palette="viridis")
        axes[0].set_title("Delivery Time by Review Score")
        axes[0].set_xlabel("Review Score")
        axes[0].set_ylabel("Delivery Time (Days)")
        axes[0].set_ylim(0, 40) # Focus on typical ranges
        
        # Violinplot of payment installments vs total order value (log scale)
        sns.violinplot(x=df["payment_installments"].clip(upper=10), y=df[TARGET_COLUMN], ax=axes[1], palette="magma", log_scale=True)
        axes[1].set_title("Order Value Distribution by Payment Installments (Clipped at 10)")
        axes[1].set_xlabel("Installments")
        axes[1].set_ylabel("Order Value (BRL)")
        
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "box_and_violin_plots.png", dpi=300)
        plt.close()

        # 8. Countplots (Payment Method, Review Scores)
        logger.info("Generating countplots...")
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        sns.countplot(x="payment_type", data=df, ax=axes[0], order=df["payment_type"].value_counts().index, palette="pastel")
        axes[0].set_title("Payment Method Distribution")
        axes[0].set_xlabel("Payment Type")
        axes[0].set_ylabel("Number of Orders")
        
        # Cast review score to int for countplot mapping
        df_review_int = df["avg_review_score"].round().astype(int)
        sns.countplot(x=df_review_int, ax=axes[1], palette="coolwarm")
        axes[1].set_title("Rounded Review Score Distribution")
        axes[1].set_xlabel("Review Score")
        axes[1].set_ylabel("Number of Orders")
        
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "countplots.png", dpi=300)
        plt.close()

        # 9. Scatterplots
        logger.info("Generating scatterplots...")
        plt.figure(figsize=(8, 6))
        sns.scatterplot(data=plot_sample, x="total_freight_cost", y=TARGET_COLUMN, alpha=0.5, hue="avg_review_score", palette="viridis")
        plt.title("Total Freight Cost vs. Total Order Value")
        plt.xlabel("Freight Cost (BRL)")
        plt.ylabel("Order Value (BRL)")
        plt.xscale("log")
        plt.yscale("log")
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "scatterplot_freight_vs_value.png", dpi=300)
        plt.close()

        # 10. Time Series Line Charts (Trends)
        logger.info("Generating revenue trends and order trends line charts...")
        # Aggregate by year-month for trends
        df_time = df.copy()
        df_time["year_month"] = df_time["order_purchase_timestamp"].dt.to_period("M").dt.to_timestamp()
        trend_df = df_time.groupby("year_month").agg(
            monthly_revenue=(TARGET_COLUMN, "sum"),
            monthly_orders=("order_id", "count")
        ).reset_index()
        
        # Line charts
        fig, ax1 = plt.subplots(figsize=(12, 6))
        
        color = 'tab:blue'
        ax1.set_xlabel('Date')
        ax1.set_ylabel('Monthly Revenue (BRL)', color=color)
        ax1.plot(trend_df['year_month'], trend_df['monthly_revenue'], color=color, marker='o', linewidth=2)
        ax1.tick_params(axis='y', labelcolor=color)
        
        ax2 = ax1.twinx()
        color = 'tab:red'
        ax2.set_ylabel('Monthly Orders', color=color)
        ax2.plot(trend_df['year_month'], trend_df['monthly_orders'], color=color, linestyle='--', marker='s', linewidth=2)
        ax2.tick_params(axis='y', labelcolor=color)
        
        plt.title("Monthly Revenue and Order Trends Over Time")
        fig.tight_layout()
        plt.savefig(PLOTS_DIR / "revenue_orders_trends.png", dpi=300)
        plt.close()

        # 11. Top Categories, Products, Sellers, Cities, States
        logger.info("Generating bar charts for top categories/locations...")
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        
        # Top 10 Categories
        top_cats = df["product_category_name_english"].value_counts().head(10)
        sns.barplot(x=top_cats.values, y=top_cats.index, ax=axes[0, 0], palette="Blues_r")
        axes[0, 0].set_title("Top 10 Product Categories by Order Count")
        axes[0, 0].set_xlabel("Order Count")
        
        # Top 10 States (Customer Location)
        top_states = df["customer_state"].value_counts().head(10)
        sns.barplot(x=top_states.values, y=top_states.index, ax=axes[0, 1], palette="Oranges_r")
        axes[0, 1].set_title("Top 10 States by Order Count")
        axes[0, 1].set_xlabel("Order Count")
        
        # Top 10 Cities
        top_cities = df["customer_city"].value_counts().head(10)
        sns.barplot(x=top_cities.values, y=top_cities.index, ax=axes[1, 0], palette="Greens_r")
        axes[1, 0].set_title("Top 10 Cities by Order Count")
        axes[1, 0].set_xlabel("Order Count")
        
        # Top 10 Sellers (Revenue contribution)
        top_sellers = df.groupby("seller_id")[TARGET_COLUMN].sum().nlargest(10)
        sns.barplot(x=top_sellers.values, y=top_sellers.index, ax=axes[1, 1], palette="Purples_r")
        axes[1, 1].set_title("Top 10 Sellers by Revenue contribution")
        axes[1, 1].set_xlabel("Revenue (BRL)")
        
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "top_rankings.png", dpi=300)
        plt.close()

        # 12. Interactive Plotly Charts
        logger.info("Generating interactive Plotly charts as HTML...")
        
        # Plotly Monthly Revenue Trend
        fig_plotly_rev = px.line(trend_df, x="year_month", y="monthly_revenue", 
                                 title="Interactive Monthly Revenue Trend",
                                 labels={"year_month": "Date", "monthly_revenue": "Revenue (BRL)"})
        fig_plotly_rev.write_html(PLOTS_DIR / "interactive_monthly_revenue.html")
        
        # Plotly Payment Method Distribution
        pay_counts = df["payment_type"].value_counts().reset_index()
        pay_counts.columns = ["payment_type", "count"]
        fig_plotly_pay = px.pie(pay_counts, values="count", names="payment_type",
                                title="Interactive Payment Method Distribution",
                                color_discrete_sequence=px.colors.qualitative.Pastel)
        fig_plotly_pay.write_html(PLOTS_DIR / "interactive_payment_method.html")
        
        # Plotly Delivery Time vs Delay Scatterplot
        fig_plotly_del = px.scatter(plot_sample, x="delivery_time", y="delivery_delay", 
                                    color="avg_review_score", hover_data=["customer_city", "customer_state"],
                                    title="Interactive Delivery Time vs Delay (Sampled)",
                                    labels={"delivery_time": "Delivery Time (Days)", "delivery_delay": "Delivery Delay (Days)"})
        fig_plotly_del.write_html(PLOTS_DIR / "interactive_delivery_analysis.html")

        # 13. ydata-profiling Report
        report_path = REPORTS_DIR / "ydata_profiling_report.html"
        if report_path.exists():
            logger.info("ydata-profiling HTML report already exists. Skipping regeneration to save time.")
        else:
            logger.info("Generating ydata-profiling HTML report...")
            # Since profiling on the full master dataset (96k rows x 55 columns) can be very resource-heavy,
            # we profile on a representative 10% sample (or 10,000 rows) which is standard and extremely fast.
            profile_sample = df.sample(min(10000, len(df)), random_state=42)
            
            # Strip datetime and ID columns for cleaner profiling
            cols_to_profile = [
                TARGET_COLUMN, "total_price", "total_freight_cost", "avg_product_price", 
                "num_items_ordered", "payment_installments", "avg_review_score", 
                "delivery_time", "delivery_delay", "customer_lifetime_value", 
                "number_of_orders", "revenue_per_customer", "revenue_per_seller", 
                "product_popularity", "customer_city", "customer_state", "payment_type", 
                "product_category_name_english"
            ]
            
            profile = ProfileReport(
                profile_sample[cols_to_profile], 
                title="Olist E-commerce Profiling Report", 
                explorative=True
            )
            
            # Write HTML report
            profile.to_file(report_path)
            logger.info("ydata-profiling report saved successfully!")

        logger.info("EDA pipeline executed successfully! All visualisations and reports saved.")
    except Exception as e:
        logger.error(f"Error during EDA pipeline: {str(e)}")
        raise e

if __name__ == "__main__":
    from src.data_loader import load_datasets
    from src.preprocessor import preprocess_timestamps, clean_datasets, merge_datasets
    from src.feature_engineering import engineer_features
    
    logging.basicConfig(level=logging.INFO)
    dfs = load_datasets()
    dfs_pre = preprocess_timestamps(dfs)
    dfs_clean = clean_datasets(dfs_pre)
    m_df = merge_datasets(dfs_clean)
    f_df = engineer_features(m_df)
    run_eda_pipeline(f_df, dfs_clean)
    print("Done generating EDA plots.")
