# PricePilot AI - Dataset Analysis

## Project Name
PricePilot AI: Machine Learning-Based Dynamic Pricing and Demand Forecasting System

---

# Dataset 1: olist_order_items_dataset.csv

## Overview

- Rows: 112650
- Columns: 7

## Columns

| Column | Description |
|---------|-------------|
| order_id | Unique order ID |
| order_item_id | Item number in an order |
| product_id | Product ID |
| seller_id | Seller ID |
| shipping_limit_date | Shipping deadline |
| price | Selling price |
| freight_value | Shipping charge |

## Missing Values

None

## Duplicate Rows

None

## Purpose

This dataset contains information about every product sold in each order. It also contains the selling price and shipping cost.

---

# Dataset 2: olist_orders_dataset.csv

## Overview

- Rows: 99441
- Columns: 8

## Columns

| Column | Description |
|---------|-------------|
| order_id | Order ID |
| customer_id | Customer ID |
| order_status | Order status |
| order_purchase_timestamp | Purchase date |
| order_approved_at | Approval date |
| order_delivered_carrier_date | Carrier delivery date |
| order_delivered_customer_date | Customer delivery date |
| order_estimated_delivery_date | Estimated delivery date |

## Missing Values

- order_approved_at : 160
- order_delivered_carrier_date : 1783
- order_delivered_customer_date : 2965

## Duplicate Rows

None

## Purpose

This dataset contains customer order and delivery information.

---

# Dataset 3: olist_products_dataset.csv

## Overview

- Rows: 32951
- Columns: 9

## Columns

| Column | Description |
|---------|-------------|
| product_id | Product ID |
| product_category_name | Product category |
| product_name_lenght | Product name length |
| product_description_lenght | Product description length |
| product_photos_qty | Number of photos |
| product_weight_g | Product weight |
| product_length_cm | Product length |
| product_height_cm | Product height |
| product_width_cm | Product width |

## Missing Values

- product_category_name : 610
- product_name_lenght : 610
- product_description_lenght : 610
- product_photos_qty : 610
- product_weight_g : 2
- product_length_cm : 2
- product_height_cm : 2
- product_width_cm : 2

## Duplicate Rows

None

## Purpose

This dataset contains product information and physical characteristics.

---

# Dataset Relationships

The datasets are connected using two common keys.

Products Dataset
        |
        | product_id
        |
Order Items Dataset
        |
        | order_id
        |
Orders Dataset

---

# Machine Learning Target

## Price Prediction

Target Column:

price

## Demand Forecast

Demand will be calculated by counting the number of times each product appears in the order items dataset.

---

# Next Step

Merge all three datasets using:

- product_id
- order_id

Then perform:

- Data Cleaning
- Missing Value Handling
- Feature Engineering
- Model Training