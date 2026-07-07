import pandas as pd
import plotext as plt

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder,StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score


data=pd.read_csv(
"dataset/olist_customers_dataset.csv"
)


city=LabelEncoder()
state=LabelEncoder()


data["customer_city"]=city.fit_transform(
data["customer_city"]
)


data["customer_state"]=state.fit_transform(
data["customer_state"]
)


X=data[
[
"customer_zip_code_prefix",
"customer_city"
]
]


y=data["customer_state"]


scaler=StandardScaler()


X=scaler.fit_transform(X)


X_train,X_test,y_train,y_test=train_test_split(
X,
y,
test_size=0.2,
random_state=42
)


model=LogisticRegression(
max_iter=1000
)


model.fit(
X_train,
y_train
)


prediction=model.predict(
X_test
)


accuracy=accuracy_score(
y_test,
prediction
)


print("\n================================")
print("    Logistic Regression Model   ")
print("================================")


print(
"\nAccuracy:",
round(accuracy*100,2),
"%"
)


table=pd.DataFrame(
{
"Actual State":
state.inverse_transform(y_test[:10]),

"Predicted State":
state.inverse_transform(prediction[:10])
}
)


print("\nSample Prediction Table\n")

print(table)



plt.clear_figure()

plt.plotsize(
45,
10
)


plt.bar(
["Logistic"],
[accuracy*100]
)


plt.title(
"Logistic Regression Accuracy"
)


plt.ylim(
0,
100
)


plt.show()


print(
"\nLogistic Regression Completed Successfully"
)