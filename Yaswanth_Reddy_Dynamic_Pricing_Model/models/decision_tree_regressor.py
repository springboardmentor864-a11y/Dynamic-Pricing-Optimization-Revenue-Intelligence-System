import pandas as pd
import matplotlib.pyplot as plt

from sklearn.tree import DecisionTreeRegressor,plot_tree
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


model=DecisionTreeRegressor(
max_depth=3,
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
"Decision Tree R2 Score:",
r2_score(
y_test,
prediction
)
)


plt.figure(
figsize=(8,4)
)


plot_tree(
model,
feature_names=X.columns,
filled=True,
rounded=True,
fontsize=8
)


plt.title(
"Dynamic Pricing Decision Tree"
)


plt.tight_layout()

plt.show()