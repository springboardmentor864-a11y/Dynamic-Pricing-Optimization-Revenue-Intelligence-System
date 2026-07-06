import pandas as pd
import matplotlib.pyplot as plt


from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix
from sklearn.metrics import ConfusionMatrixDisplay


# ==========================
# Load Dataset
# ==========================

data = pd.read_csv(
    "dataset/loan_dataset.csv"
)


# ==========================
# Features and Target
# ==========================

X = data.drop(
    "Loan_Status",
    axis=1
)

y = data[
    "Loan_Status"
]


# ==========================
# Train Test Split
# ==========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# ==========================
# Random Forest Model
# ==========================

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)


# Train Model

model.fit(
    X_train,
    y_train
)


# ==========================
# Prediction
# ==========================

prediction = model.predict(
    X_test
)


# ==========================
# Accuracy
# ==========================

accuracy = accuracy_score(
    y_test,
    prediction
)


print(
    "Random Forest Accuracy:",
    round(
        accuracy,
        2
    )
)



# ==========================
# Confusion Matrix Graph
# ==========================

cm = confusion_matrix(
    y_test,
    prediction
)


display = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=[
        "Rejected",
        "Approved"
    ]
)


display.plot()


plt.title(
    "Random Forest Confusion Matrix"
)


plt.gcf().set_size_inches(
    5,
    4
)


plt.tight_layout()


plt.show()



# ==========================
# Feature Importance Graph
# ==========================


importance = model.feature_importances_


plt.figure(
    figsize=(6,4)
)


plt.bar(
    X.columns,
    importance
)


plt.title(
    "Random Forest Feature Importance"
)


plt.xlabel(
    "Features"
)


plt.ylabel(
    "Importance"
)


plt.xticks(
    rotation=30
)


plt.tight_layout()


plt.show()