import mlflow
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

mlflow.set_tracking_uri("http://127.0.0.1:5000")
mlflow.set_experiment("score_credit_v2")

X, y = make_classification(n_samples=1000, n_features=10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

with mlflow.start_run(run_name="test_journalisation"):
    model = LogisticRegression(C=0.1, max_iter=100, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    mlflow.log_param("C", 0.1)
    mlflow.log_param("max_iter", 100)
    mlflow.log_metric("accuracy", accuracy_score(y_test, y_pred))
    mlflow.log_metric("auc_roc", roc_auc_score(y_test, y_proba))
    print("Run loggee avec succes !")
    print(f"Accuracy : {accuracy_score(y_test, y_pred):.4f}")
    print(f"AUC-ROC  : {roc_auc_score(y_test, y_proba):.4f}")