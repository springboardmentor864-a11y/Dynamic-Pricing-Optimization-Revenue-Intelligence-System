import pandas as pd
import matplotlib.pyplot as plt


from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix
from sklearn.metrics import ConfusionMatrixDisplay
from sklearn.preprocessing import StandardScaler


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
# Scaling
# ==========================

scaler = StandardScaler()


X = scaler.fit_transform(
    X
)


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
# Logistic Regression Model
# ==========================

model = LogisticRegression()


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
    "Logistic Regression Accuracy:",
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
    "Logistic Regression Confusion Matrix"
)


plt.gcf().set_size_inches(
    5,
    4
)


plt.tight_layout()


plt.show()