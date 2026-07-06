import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error,r2_score


data=pd.read_csv(
    "dataset/dynamic_pricing_dataset.csv"
)


X=data.drop(
    ["Product_ID","Optimized_Price"],
    axis=1
)

y=data["Optimized_Price"]


X_train,X_test,y_train,y_test=train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


model=LinearRegression()


model.fit(
    X_train,
    y_train
)


prediction=model.predict(
    X_test
)


print(
    "Linear Regression MAE:",
    mean_absolute_error(
        y_test,
        prediction
    )
)


print(
    "R2 Score:",
    r2_score(
        y_test,
        prediction
    )
)


plt.figure(figsize=(5,4))


plt.scatter(
    y_test,
    prediction
)


plt.xlabel(
    "Actual Price"
)

plt.ylabel(
    "Predicted Price"
)


plt.title(
    "Linear Regression Prediction"
)


plt.tight_layout()

plt.show()