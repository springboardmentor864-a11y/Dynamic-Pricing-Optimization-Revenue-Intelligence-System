import streamlit as st
import requests

st.set_page_config(
    page_title="PricePilot AI",
    page_icon="💰",
    layout="centered"
)

st.title("💰 PricePilot AI")
st.write("Machine Learning Based Dynamic Pricing System")

st.header("Enter Product Details")

order_item_id = st.number_input("Order Item ID", value=1)

freight_value = st.number_input("Freight Value")

order_status = st.number_input("Order Status (Encoded)", value=1)

product_category_name = st.number_input("Product Category (Encoded)", value=1)

product_name_lenght = st.number_input("Product Name Length")

product_description_lenght = st.number_input("Product Description Length")

product_photos_qty = st.number_input("Product Photos Quantity")

product_weight_g = st.number_input("Product Weight (g)")

product_length_cm = st.number_input("Product Length (cm)")

product_height_cm = st.number_input("Product Height (cm)")

product_width_cm = st.number_input("Product Width (cm)")

purchase_year = st.number_input("Purchase Year", value=2018)

purchase_month = st.number_input("Purchase Month", value=1)

purchase_day = st.number_input("Purchase Day", value=1)

purchase_weekday = st.number_input("Purchase Weekday", value=1)

product_volume = st.number_input("Product Volume")

if st.button("Predict Price"):

    payload = {
        "order_item_id": order_item_id,
        "freight_value": freight_value,
        "order_status": order_status,
        "product_category_name": product_category_name,
        "product_name_lenght": product_name_lenght,
        "product_description_lenght": product_description_lenght,
        "product_photos_qty": product_photos_qty,
        "product_weight_g": product_weight_g,
        "product_length_cm": product_length_cm,
        "product_height_cm": product_height_cm,
        "product_width_cm": product_width_cm,
        "purchase_year": purchase_year,
        "purchase_month": purchase_month,
        "purchase_day": purchase_day,
        "purchase_weekday": purchase_weekday,
        "product_volume": product_volume
    }

    try:
        response = requests.post(
            "http://127.0.0.1:8000/predict",
            json=payload
        )

        if response.status_code == 200:
            result = response.json()
            st.success(f"Predicted Price: ₹{result['Predicted Price']:.2f}")
        else:
            st.error("Prediction failed.")
            st.write(response.json())

    except Exception as e:
        st.error("Cannot connect to FastAPI server.")
        st.write(e)