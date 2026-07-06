import pandas as pd
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score


data=pd.read_csv(
"dataset/dynamic_pricing_dataset.csv"
)


X=data.drop(
["Product_ID","Optimized_Price"],
axis=1
)

y=data["Optimized_Price"]


X_train,X_test,y_train,y_test=train_test_split(
X,y,
test_size=0.2,
random_state=42
)


model=RandomForestRegressor(
n_estimators=100,
random_state=42
)


model.fit(
X_train,
y_train
)


prediction=model.predict(
X_test
)


print(
"Random Forest R2 Score:",
r2_score(y_test,prediction)
)


importance=model.feature_importances_


plt.figure(figsize=(6,4))


plt.bar(
X.columns,
importance
)


plt.xticks(rotation=30)


plt.title(
"Feature Importance"
)


plt.tight_layout()


plt.show()