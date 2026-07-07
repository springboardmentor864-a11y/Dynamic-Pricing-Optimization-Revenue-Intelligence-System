import pandas as pd
import plotext as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report


# ==================================================
# Load Dataset
# ==================================================

data = pd.read_csv(
    "dataset/olist_customers_dataset.csv"
)


# selecting required columns

data = data[
    [
        "customer_zip_code_prefix",
        "customer_city",
        "customer_state"
    ]
]


# ==================================================
# Encoding Categorical Data
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
# Feature and Target Split
# ==================================================

X = data.drop(
    "customer_state",
    axis=1
)


y = data[
    "customer_state"
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
# Decision Tree Model
# ==================================================

model = DecisionTreeClassifier(
    random_state=42
)


model.fit(
    X_train,
    y_train
)


# ==================================================
# Prediction
# ==================================================

prediction = model.predict(
    X_test
)


accuracy = accuracy_score(
    y_test,
    prediction
)


# ==================================================
# Accuracy Result
# ==================================================

print("\n================================")
print("      Decision Tree Model       ")
print("================================")


print(
    "\nAccuracy:",
    round(
        accuracy * 100,
        2
    ),
    "%"
)


# ==================================================
# Classification Report
# ==================================================

print(
    "\nClassification Report\n"
)


print(
    classification_report(
        y_test,
        prediction
    )
)


# ==================================================
# Prediction Table
# ==================================================

prediction_table = pd.DataFrame(
    {
        "Actual State":
            state_encoder.inverse_transform(
                y_test[:10]
            ),

        "Predicted State":
            state_encoder.inverse_transform(
                prediction[:10]
            )
    }
)


print(
    "\nSample Prediction Table\n"
)


print(
    prediction_table
)


# ==================================================
# Small Accuracy Graph
# ==================================================

plt.clear_figure()


plt.plotsize(
    45,
    10
)


plt.bar(
    [
        "Decision Tree"
    ],
    [
        accuracy * 100
    ]
)


plt.title(
    "Decision Tree Accuracy"
)


plt.ylim(
    0,
    100
)


plt.show()


# ==================================================
# Top Customer State Prediction Graph
# ==================================================

predicted_states = state_encoder.inverse_transform(
    prediction
)


state_count = pd.Series(
    predicted_states
).value_counts().head(5)



plt.clear_figure()


plt.plotsize(
    45,
    12
)


plt.bar(
    state_count.index.tolist(),
    state_count.values.tolist()
)


plt.title(
    "Top 5 Predicted States"
)


plt.show()


# ==================================================
# End Message
# ==================================================

print(
    "\nDecision Tree Model Completed Successfully"
)