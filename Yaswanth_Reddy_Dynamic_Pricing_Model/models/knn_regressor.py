import pandas as pd

from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score


data=pd.read_csv(
"dataset/dynamic_pricing_dataset.csv"
)


X=data.drop(
["Product_ID","Optimized_Price"],
axis=1
)


y=data[
"Optimized_Price"
]


scaler=StandardScaler()

X=scaler.fit_transform(
X
)


X_train,X_test,y_train,y_test=train_test_split(
X,
y,
test_size=0.2,
random_state=42
)


model=KNeighborsRegressor(
n_neighbors=3
)


model.fit(
X_train,
y_train
)


prediction=model.predict(
X_test
)


print(
"KNN R2 Score:",
r2_score(
y_test,
prediction
)
)