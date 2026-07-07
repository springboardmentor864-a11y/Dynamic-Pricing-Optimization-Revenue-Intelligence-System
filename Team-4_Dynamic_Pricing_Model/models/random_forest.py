import pandas as pd
import plotext as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


# Load Dataset

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


# Encoding

city_encoder = LabelEncoder()
state_encoder = LabelEncoder()


data["customer_city"] = city_encoder.fit_transform(
    data["customer_city"]
)


data["customer_state"] = state_encoder.fit_transform(
    data["customer_state"]
)


# Split

X = data.drop(
    "customer_state",
    axis=1
)


y = data["customer_state"]


X_train,X_test,y_train,y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# Model

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)


model.fit(
    X_train,
    y_train
)


prediction = model.predict(
    X_test
)


accuracy = accuracy_score(
    y_test,
    prediction
)


print("\n================================")
print("      Random Forest Model       ")
print("================================")


print(
    "\nAccuracy:",
    round(accuracy*100,2),
    "%"
)


# Prediction Table

table = pd.DataFrame(
    {
        "Actual State":
        state_encoder.inverse_transform(y_test[:10]),

        "Predicted State":
        state_encoder.inverse_transform(prediction[:10])
    }
)


print("\nSample Prediction Table\n")


print(table)


# Accuracy Graph

plt.clear_figure()

plt.plotsize(
    45,
    10
)


plt.bar(
    ["Random Forest"],
    [accuracy*100]
)


plt.title(
    "Random Forest Accuracy"
)


plt.ylim(
    0,
    100
)


plt.show()



# State Graph

states = state_encoder.inverse_transform(
    prediction
)


count = pd.Series(
    states
).value_counts().head(5)


plt.clear_figure()


plt.plotsize(
    45,
    12
)


plt.bar(
    count.index.tolist(),
    count.values.tolist()
)


plt.title(
    "Top 5 Predicted States"
)


plt.show()


print(
    "\nRandom Forest Completed Successfully"
)