import pandas as pd
import plotext as plt

from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error


# ==================================================
# Load Dataset
# ==================================================

data = pd.read_csv(
    "dataset/olist_customers_dataset.csv"
)


data = data[
    [
        "customer_zip_code_prefix",
        "customer_city",
        "customer_state"
    ]
]


# ==================================================
# Encoding
# ==================================================

city_encoder = LabelEncoder()
state_encoder = LabelEncoder()


data["customer_city"] = city_encoder.fit_transform(
    data["customer_city"]
)


data["customer_state"] = state_encoder.fit_transform(
    data["customer_state"]
)



# ==================================================
# Feature and Target
# ==================================================

X = data[
    [
        "customer_city",
        "customer_state"
    ]
]


y = data[
    "customer_zip_code_prefix"
]


# ==================================================
# Train Test Split
# ==================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)



# ==================================================
# Linear Regression Model
# ==================================================

model = LinearRegression()


model.fit(
    X_train,
    y_train
)


prediction = model.predict(
    X_test
)


# ==================================================
# Evaluation
# ==================================================

r2 = r2_score(
    y_test,
    prediction
)


mae = mean_absolute_error(
    y_test,
    prediction
)



print("\n================================")
print("     Linear Regression Model    ")
print("================================")


print(
    "\nR2 Score:",
    round(
        r2,
        4
    )
)


print(
    "Mean Absolute Error:",
    round(
        mae,
        2
    )
)



# ==================================================
# Prediction Table
# ==================================================

table = pd.DataFrame(
    {
        "Actual Zip Code":
            y_test[:10].values,


        "Predicted Zip Code":
            prediction[:10].round()
    }
)



print(
    "\nSample Prediction Table\n"
)


print(
    table
)



# ==================================================
# R2 Score Graph
# ==================================================

plt.clear_figure()


plt.plotsize(
    45,
    10
)


plt.bar(
    [
        "Linear Regression"
    ],
    [
        r2 * 100
    ]
)


plt.title(
    "Linear Regression R2 Score"
)


plt.show()



# ==================================================
# Prediction Comparison Graph
# ==================================================

plt.clear_figure()


plt.plotsize(
    45,
    12
)


plt.plot(
    list(range(1,11)),
    y_test[:10].values.tolist(),
    label="Actual"
)


plt.plot(
    list(range(1,11)),
    prediction[:10].tolist(),
    label="Predicted"
)


plt.title(
    "Actual vs Predicted Zip Codes"
)


plt.show()



print(
    "\nLinear Regression Completed Successfully"
)