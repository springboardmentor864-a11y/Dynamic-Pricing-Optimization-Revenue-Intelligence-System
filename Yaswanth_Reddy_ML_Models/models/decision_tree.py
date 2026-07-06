import pandas as pd
import matplotlib.pyplot as plt


from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.tree import plot_tree
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix
from sklearn.metrics import ConfusionMatrixDisplay


# ====================================
# Load Dataset
# ====================================

data = pd.read_csv(
    "dataset/loan_dataset.csv"
)


# ====================================
# Split Features and Target
# ====================================

X = data.drop(
    "Loan_Status",
    axis=1
)

y = data[
    "Loan_Status"
]


# ====================================
# Train Test Split
# ====================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# ====================================
# Create Decision Tree Model
# ====================================

model = DecisionTreeClassifier(
    max_depth=3,
    random_state=42
)


# ====================================
# Train Model
# ====================================

model.fit(
    X_train,
    y_train
)


# ====================================
# Prediction
# ====================================

prediction = model.predict(
    X_test
)


# ====================================
# Accuracy
# ====================================

accuracy = accuracy_score(
    y_test,
    prediction
)


print(
    "Decision Tree Accuracy:",
    round(
        accuracy,
        2
    )
)


# ====================================
# Confusion Matrix Visualization
# ====================================

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
    "Decision Tree Confusion Matrix",
    fontsize=12
)


plt.gcf().set_size_inches(
    5,
    4
)


plt.tight_layout()


plt.show()



# ====================================
# Decision Tree Visualization
# ====================================


plt.figure(
    figsize=(
        8,
        4
    )
)


plot_tree(
    model,
    feature_names=X.columns,
    class_names=[
        "Rejected",
        "Approved"
    ],
    filled=True,
    rounded=True,
    fontsize=8,
    impurity=False,
    proportion=True
)


plt.title(
    "Decision Tree Classifier",
    fontsize=12
)


plt.tight_layout()


plt.show()