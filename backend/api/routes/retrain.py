import os
import json
import pickle
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, BackgroundTasks
from sqlalchemy import create_engine, text
import mlflow
import mlflow.sklearn
from datetime import datetime

router = APIRouter()

DB_URL = "postgresql://postgres:postgres123@localhost:5432/score_credit_db"
MODELS_PATH = "notebooks/models"
MLFLOW_URI = "http://127.0.0.1:5000"
VERSION_FILE = "notebooks/models/model_version.json"

COUT_FN = 10  # Faux négatif — accorder à quelqu'un qui va faire défaut
COUT_FP = 1   # Faux positif — refuser à quelqu'un qui aurait remboursé

# ─────────────────────────────────────────────
# GESTION DES VERSIONS
# ─────────────────────────────────────────────
def get_model_version() -> str:
    try:
        with open(VERSION_FILE, "r") as f:
            data = json.load(f)
            return data.get("version", "1.0.0")
    except:
        return "1.0.0"

def increment_version(version: str) -> str:
    try:
        parts = version.split(".")
        parts[2] = str(int(parts[2]) + 1)
        return ".".join(parts)
    except:
        return "1.0.1"

def save_model_version(version: str, auc: float, score_metier: int, model_name: str, timestamp: str):
    try:
        with open(VERSION_FILE, "w") as f:
            json.dump({
                "version": version,
                "auc_roc": auc,
                "score_metier": score_metier,
                "model_name": model_name,
                "timestamp": timestamp,
                "description": f"Réentraînement automatique — {model_name} — AUC-ROC : {auc} — Score métier : {score_metier}"
            }, f, indent=2)
    except Exception as e:
        print(f"⚠️ Erreur sauvegarde version : {e}")

def calculer_score_metier(predictions, y_true):
    """Calcule le score métier basé sur les coûts FN/FP."""
    score = 0
    for pred, vrai in zip(predictions, y_true):
        if pred == 1 and vrai == 0:
            score += COUT_FN  # Faux négatif
        elif pred == 0 and vrai == 1:
            score += COUT_FP  # Faux positif
    return score


# ─────────────────────────────────────────────
# ÉTAT DU RÉENTRAÎNEMENT
# ─────────────────────────────────────────────
retrain_status = {
    "running": False,
    "progress": 0,
    "message": "Inactif",
    "last_run": None,
    "last_result": None,
    "error": None
}

def update_status(progress, message):
    retrain_status["progress"] = progress
    retrain_status["message"] = message
    print(f"[RETRAIN] {progress}% — {message}")


# ─────────────────────────────────────────────
# PIPELINE DE RÉENTRAÎNEMENT MULTI-MODÈLES
# ─────────────────────────────────────────────
def run_retraining():
    retrain_status["running"] = True
    retrain_status["error"] = None
    retrain_status["progress"] = 0

    engine = None

    try:
        # ── Import des librairies ML ──
        try:
            from xgboost import XGBClassifier
            from sklearn.linear_model import LogisticRegression
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.dummy import DummyClassifier
            from sklearn.metrics import roc_auc_score
            from sklearn.preprocessing import StandardScaler
            from sklearn.pipeline import Pipeline
            from imblearn.over_sampling import SMOTE
        except ImportError as e:
            raise Exception(f"Librairie ML manquante : {e}")

        engine = create_engine(DB_URL)

        # ── Étape 1 : Charger colonnes et médianes ──
        update_status(3, "Chargement des colonnes du modèle...")
        try:
            with open(f"{MODELS_PATH}/feature_columns.pkl", "rb") as f:
                feature_columns = pickle.load(f)
            with open(f"{MODELS_PATH}/feature_medians.pkl", "rb") as f:
                feature_medians = pickle.load(f)
        except Exception as e:
            raise Exception(f"Impossible de charger feature_columns.pkl ou feature_medians.pkl : {e}")

        # ── Étape 2 : Charger données initiales ──
        update_status(8, "Chargement des données initiales depuis PostgreSQL...")
        try:
            df_init = pd.read_sql("SELECT * FROM application_train LIMIT 100000", engine)
            if len(df_init) == 0:
                raise Exception("La table application_train est vide")
            update_status(15, f"Données initiales chargées : {len(df_init)} lignes")
        except Exception as e:
            raise Exception(f"Erreur chargement application_train : {e}")

        try:
            y_init = df_init["TARGET"].values
        except KeyError:
            raise Exception("Colonne TARGET introuvable dans application_train")

        df_init = df_init.drop(columns=["TARGET", "SK_ID_CURR"], errors="ignore")

        # ── Étape 3 : Encoder + aligner ──
        update_status(18, "Encodage et alignement des features...")
        try:
            if "NAME_CONTRACT_TYPE" in df_init.columns:
                df_init["NAME_CONTRACT_TYPE"] = df_init["NAME_CONTRACT_TYPE"].map(
                    {"Cash loans": 0, "Revolving loans": 1}
                ).fillna(0)
            if "CODE_GENDER" in df_init.columns:
                df_init["CODE_GENDER_M"] = (df_init["CODE_GENDER"] == "M").astype(int)
            if "FLAG_OWN_CAR" in df_init.columns:
                df_init["FLAG_OWN_CAR"] = (df_init["FLAG_OWN_CAR"] == "Y").astype(int)
            if "FLAG_OWN_REALTY" in df_init.columns:
                df_init["FLAG_OWN_REALTY"] = (df_init["FLAG_OWN_REALTY"] == "Y").astype(int)

            days_birth    = df_init.get("DAYS_BIRTH",       pd.Series([0]*len(df_init)))
            days_employed = df_init.get("DAYS_EMPLOYED",    pd.Series([0]*len(df_init)))
            amt_credit    = df_init.get("AMT_CREDIT",       pd.Series([500000]*len(df_init)))
            amt_income    = df_init.get("AMT_INCOME_TOTAL", pd.Series([150000]*len(df_init))).replace(0, 1)
            amt_annuity   = df_init.get("AMT_ANNUITY",      pd.Series([25000]*len(df_init))).replace(0, 1)
            amt_goods     = df_init.get("AMT_GOODS_PRICE",  pd.Series([450000]*len(df_init))).replace(0, 1)

            df_init["AGE_YEARS"]             = abs(days_birth) // 365
            df_init["YEARS_EMPLOYED"]        = abs(days_employed) / 365
            df_init["CREDIT_INCOME_RATIO"]   = amt_credit / amt_income
            df_init["ANNUITY_INCOME_RATIO"]  = amt_annuity / amt_income
            df_init["CREDIT_GOODS_RATIO"]    = amt_credit / amt_goods
            df_init["CREDIT_DURATION"]       = amt_credit / amt_annuity
            df_init["DAYS_EMPLOYED_ANOMALY"] = (days_employed > 0).astype(int)

            cols_to_add = {col: feature_medians.get(col, 0)
                           for col in feature_columns if col not in df_init.columns}
            if cols_to_add:
                df_init = pd.concat([df_init, pd.DataFrame(cols_to_add, index=df_init.index)], axis=1)

            df_init = df_init[feature_columns]
            df_init = df_init.apply(pd.to_numeric, errors="coerce")
            df_init = df_init.fillna(pd.Series(feature_medians))
            X_init  = df_init.values.astype(np.float64)
            update_status(22, f"Features alignées : {X_init.shape[1]} colonnes")
        except Exception as e:
            raise Exception(f"Erreur alignement features : {e}")

        # ── Étape 4 : Charger données de production ──
        update_status(25, "Chargement des données de production depuis PostgreSQL...")
        try:
            df_prod = pd.read_sql("""
                SELECT revenu, credit, annuite, age, anciennete,
                       probabilite_defaut, decision
                FROM predictions
                WHERE date_analyse >= NOW() - INTERVAL '90 days'
            """, engine)
            update_status(28, f"Données production chargées : {len(df_prod)} lignes")
        except Exception as e:
            print(f"⚠️ Erreur chargement predictions : {e} — on continue sans données production")
            df_prod = pd.DataFrame()

        # ── Étape 5 : Construire features production ──
        if len(df_prod) > 0:
            update_status(30, "Construction des features de production...")
            try:
                X_prod_list = []
                y_prod_list = []

                for _, row in df_prod.iterrows():
                    try:
                        age_years = float(row["age"])       if pd.notna(row["age"])       else 33.0
                        anc_years = float(row["anciennete"])if pd.notna(row["anciennete"]) else 5.0
                        revenu    = float(row["revenu"])    if pd.notna(row["revenu"])     else 150000.0
                        credit    = float(row["credit"])    if pd.notna(row["credit"])     else 500000.0
                        annuite   = float(row["annuite"])   if pd.notna(row["annuite"])    else 25000.0
                        goods     = credit

                        feat_row = dict(feature_medians)
                        feat_row["AMT_INCOME_TOTAL"]     = revenu
                        feat_row["AMT_CREDIT"]           = credit
                        feat_row["AMT_ANNUITY"]          = annuite
                        feat_row["AMT_GOODS_PRICE"]      = goods
                        feat_row["DAYS_BIRTH"]           = int(age_years * -365)
                        feat_row["DAYS_EMPLOYED"]        = int(anc_years * -365)
                        feat_row["AGE_YEARS"]            = age_years
                        feat_row["YEARS_EMPLOYED"]       = anc_years
                        feat_row["CREDIT_INCOME_RATIO"]  = credit / revenu   if revenu  > 0 else 0
                        feat_row["ANNUITY_INCOME_RATIO"] = annuite / revenu  if revenu  > 0 else 0
                        feat_row["CREDIT_GOODS_RATIO"]   = credit / goods    if goods   > 0 else 1
                        feat_row["CREDIT_DURATION"]      = credit / annuite  if annuite > 0 else 0
                        feat_row["DAYS_EMPLOYED_ANOMALY"]= 0
                        feat_row["NAME_CONTRACT_TYPE"]   = 0
                        feat_row["FLAG_OWN_CAR"]         = 0
                        feat_row["FLAG_OWN_REALTY"]      = 0
                        feat_row["CODE_GENDER_M"]        = 0

                        X_prod_list.append([float(feat_row.get(col, 0)) for col in feature_columns])
                        y_prod_list.append(1 if row["decision"] == "REFUSÉ" else 0)
                    except Exception as row_err:
                        print(f"⚠️ Ligne ignorée : {row_err}")
                        continue

                if len(X_prod_list) > 0:
                    X_prod     = np.array(X_prod_list, dtype=np.float64)
                    y_prod     = np.array(y_prod_list)
                    X_combined = np.vstack([X_init, X_prod])
                    y_combined = np.concatenate([y_init, y_prod])
                    update_status(34, f"Dataset combiné : {len(X_combined)} lignes")
                else:
                    X_combined = X_init
                    y_combined = y_init
                    update_status(34, "Données production ignorées — utilisation données initiales")
            except Exception as e:
                print(f"⚠️ Erreur construction features production : {e}")
                X_combined = X_init
                y_combined = y_init
        else:
            X_combined = X_init
            y_combined = y_init
            update_status(34, "Pas de données production — utilisation données initiales uniquement")

        # ── Étape 6 : Charger ancien modèle ──
        update_status(37, "Chargement de l'ancien modèle pour comparaison...")
        try:
            with open(f"{MODELS_PATH}/best_xgb.pkl", "rb") as f:
                old_model = pickle.load(f)
            with open(f"{MODELS_PATH}/X_test.pkl", "rb") as f:
                X_test = pickle.load(f)
            with open(f"{MODELS_PATH}/y_test.pkl", "rb") as f:
                y_test = pickle.load(f)

            old_proba       = old_model.predict_proba(X_test)[:, 1]
            old_pred        = (old_proba >= 0.5).astype(int)
            old_auc         = roc_auc_score(y_test, old_proba)
            old_score_metier= calculer_score_metier(old_pred, y_test)
            old_version     = get_model_version()
            update_status(40, f"Ancien modèle v{old_version} — AUC-ROC : {old_auc:.4f} — Score métier : {old_score_metier}")
        except Exception as e:
            raise Exception(f"Impossible de charger l'ancien modèle ou les données test : {e}")

        # ── Étape 7 : SMOTE ──
        update_status(43, "Application de SMOTE pour rééquilibrage...")
        try:
            X_combined = X_combined.astype(np.float64)
            X_combined = np.nan_to_num(X_combined, nan=0.0, posinf=0.0, neginf=0.0)
            smote = SMOTE(random_state=42, k_neighbors=3)
            X_resampled, y_resampled = smote.fit_resample(X_combined, y_combined)
            update_status(48, f"Après SMOTE : {len(X_resampled)} lignes")
        except Exception as e:
            raise Exception(f"Erreur SMOTE : {e}")

        # ── Étape 8 : Entraîner tous les modèles ──
        modeles = {
            "XGBoost": XGBClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.1,
                scale_pos_weight=10,
                random_state=42,
                eval_metric="auc",
                verbosity=0
            ),
            "RandomForest": RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                random_state=42,
                n_jobs=-1,
                class_weight="balanced"
            ),
            "LogisticRegression": Pipeline([
                ("scaler", StandardScaler()),
                ("model", LogisticRegression(
                    max_iter=500,
                    class_weight="balanced",
                    random_state=42
                ))
            ]),
            "DummyClassifier": DummyClassifier(
                strategy="most_frequent",
                random_state=42
            ),
        }

        resultats    = {}
        total_modeles = len(modeles)

        for idx, (nom, modele) in enumerate(modeles.items()):
            pct_debut = 50 + idx * 10
            update_status(pct_debut, f"Entraînement {nom} ({idx+1}/{total_modeles})...")
            try:
                modele.fit(X_resampled, y_resampled)
                proba        = modele.predict_proba(X_test)[:, 1]
                predictions  = (proba >= 0.5).astype(int)
                auc          = roc_auc_score(y_test, proba)
                score_metier = calculer_score_metier(predictions, y_test)
                resultats[nom] = {
                    "modele":       modele,
                    "auc":          auc,
                    "score_metier": score_metier
                }
                update_status(pct_debut + 8,
                    f"{nom} — AUC-ROC : {auc:.4f} — Score métier : {score_metier}")
            except Exception as e:
                print(f"⚠️ Erreur entraînement {nom} : {e} — modèle ignoré")
                continue

        if not resultats:
            raise Exception("Aucun modèle n'a pu être entraîné")

        # ── Étape 9 : Choisir le meilleur (par AUC-ROC) ──
        update_status(92, "Comparaison des modèles...")
        meilleur_nom     = max(resultats, key=lambda k: resultats[k]["auc"])
        meilleur_modele  = resultats[meilleur_nom]["modele"]
        meilleur_auc     = resultats[meilleur_nom]["auc"]
        meilleur_score   = resultats[meilleur_nom]["score_metier"]

        print(f"\n{'='*55}")
        print(f"📊 RÉSULTATS COMPARAISON :")
        print(f"{'Modèle':<25} {'AUC-ROC':>10} {'Score métier':>15}")
        print(f"{'-'*55}")
        for nom, res in sorted(resultats.items(), key=lambda x: x[1]["auc"], reverse=True):
            emoji = "🏆" if nom == meilleur_nom else "  "
            print(f"  {emoji} {nom:<22} {res['auc']:>8.4f}   {res['score_metier']:>12}")
        print(f"{'='*55}\n")

        # ── Étape 10 : Logger dans MLFlow ──
        update_status(94, "Logging dans MLFlow...")
        new_version = increment_version(old_version)
        try:
            mlflow.set_tracking_uri(MLFLOW_URI)
            mlflow.set_experiment("score_credit_retrain")
            with mlflow.start_run(
                run_name=f"retrain_v{new_version}_{datetime.now().strftime('%Y%m%d_%H%M')}"
            ):
                mlflow.log_param("best_model",      meilleur_nom)
                mlflow.log_param("version",         new_version)
                mlflow.log_param("data_source",     "initial + production")
                mlflow.log_param("n_samples",       len(X_resampled))
                mlflow.log_param("n_prod_samples",  len(df_prod))
                mlflow.log_metric("best_auc_roc",   meilleur_auc)
                mlflow.log_metric("best_score_metier", meilleur_score)
                mlflow.log_metric("old_auc_roc",    old_auc)
                mlflow.log_metric("old_score_metier", old_score_metier)
                mlflow.log_metric("improvement",    meilleur_auc - old_auc)
                # AUC + Score métier pour chaque modèle
                for nom, res in resultats.items():
                    mlflow.log_metric(f"auc_{nom.lower()}",          res["auc"])
                    mlflow.log_metric(f"score_metier_{nom.lower()}", res["score_metier"])
                mlflow.sklearn.log_model(meilleur_modele, "model")
                mlflow.set_tag("improved", str(meilleur_auc > old_auc))
                mlflow.set_tag("status",   "success")
            print("✅ MLFlow run terminé avec succès")
        except Exception as e:
            print(f"⚠️ MLFlow non disponible : {e}")

        # ── Étape 11 : Déployer si meilleur ──
        update_status(96, "Déploiement du meilleur modèle...")
        improved = meilleur_auc > old_auc

        if improved:
            try:
                backup_path = f"{MODELS_PATH}/best_xgb_v{old_version}_{datetime.now().strftime('%Y%m%d_%H%M')}.pkl"
                with open(backup_path, "wb") as f:
                    pickle.dump(old_model, f)
                with open(f"{MODELS_PATH}/best_xgb.pkl", "wb") as f:
                    pickle.dump(meilleur_modele, f)
                save_model_version(
                    new_version,
                    round(meilleur_auc, 4),
                    meilleur_score,
                    meilleur_nom,
                    datetime.now().strftime("%Y-%m-%d %H:%M")
                )
                print(f"✅ Version : v{old_version} → v{new_version} ({meilleur_nom})")
            except Exception as e:
                raise Exception(f"Erreur sauvegarde modèle : {e}")

            # Option B : Recharger en mémoire
            try:
                import shap
                import api.routes.predict as predict_module
                predict_module.model     = meilleur_modele
                predict_module.explainer = shap.TreeExplainer(meilleur_modele)
                update_status(98, f"✅ {meilleur_nom} v{new_version} déployé et rechargé ! "
                                  f"AUC-ROC : {old_auc:.4f} → {meilleur_auc:.4f} | "
                                  f"Score métier : {old_score_metier} → {meilleur_score}")
            except Exception as e:
                print(f"⚠️ Rechargement mémoire échoué : {e}")
                update_status(98, f"✅ {meilleur_nom} v{new_version} sauvegardé — redémarrez l'API. "
                                  f"AUC-ROC : {old_auc:.4f} → {meilleur_auc:.4f}")
        else:
            update_status(98, f"⚠️ Ancien modèle conservé : AUC-ROC {old_auc:.4f} vs {meilleur_auc:.4f} | "
                              f"Score métier {old_score_metier} vs {meilleur_score}")

        # ── Log dans actions_log ──
        try:
            comparaison = " | ".join([
                f"{n}: AUC={r['auc']:.4f} Score={r['score_metier']}"
                for n, r in sorted(resultats.items(), key=lambda x: x[1]["auc"], reverse=True)
            ])
            with engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO actions_log (type, titre, message, statut)
                    VALUES (:type, :titre, :message, :statut)
                """), {
                    "type":    "retrain",
                    "titre":   f"Réentraînement multi-modèles — v{old_version} → v{new_version if improved else old_version}",
                    "message": f"Meilleur : {meilleur_nom} AUC={meilleur_auc:.4f} Score={meilleur_score} | {comparaison}",
                    "statut":  "success" if improved else "warning"
                })
                conn.commit()
        except Exception as e:
            print(f"⚠️ Erreur log actions : {e}")

        retrain_status["last_result"] = {
            "old_version":      old_version,
            "new_version":      new_version if improved else old_version,
            "old_auc":          round(old_auc, 4),
            "new_auc":          round(meilleur_auc, 4),
            "old_score_metier": int(old_score_metier),
            "new_score_metier": int(meilleur_score),
            "best_model":       meilleur_nom,
            "improvement":      round(meilleur_auc - old_auc, 4),
            "improved":         improved,
            "resultats":        {
                nom: {
                    "auc":          round(res["auc"], 4),
                    "score_metier": int(res["score_metier"])
                }
                for nom, res in resultats.items()
            },
            "n_samples":        len(X_resampled),
            "n_prod_samples":   len(df_prod),
            "timestamp":        datetime.now().strftime("%Y-%m-%d %H:%M")
        }

        update_status(100, f"✅ Pipeline terminé ! Meilleur : {meilleur_nom} "
                           f"{'v' + new_version + ' déployé' if improved else '— ancien conservé'}")

    except Exception as e:
        import traceback
        retrain_status["error"]    = str(e)
        retrain_status["message"]  = f"❌ Erreur : {str(e)}"
        retrain_status["progress"] = 0
        print(f"❌ Erreur réentraînement : {e}")
        traceback.print_exc()
    finally:
        retrain_status["running"]  = False
        retrain_status["last_run"] = datetime.now().strftime("%Y-%m-%d %H:%M")
        if engine:
            try:
                engine.dispose()
            except:
                pass


# ─────────────────────────────────────────────
# ENDPOINT : LANCER LE RÉENTRAÎNEMENT
# ─────────────────────────────────────────────
@router.post("/retrain")
async def retrain(background_tasks: BackgroundTasks):
    if retrain_status["running"]:
        raise HTTPException(
            status_code=409,
            detail="Un réentraînement est déjà en cours"
        )
    background_tasks.add_task(run_retraining)
    return {
        "message": "Réentraînement multi-modèles lancé en arrière-plan",
        "status":  "started"
    }


# ─────────────────────────────────────────────
# ENDPOINT : STATUT DU RÉENTRAÎNEMENT
# ─────────────────────────────────────────────
@router.get("/retrain/status")
async def get_retrain_status():
    return {
        **retrain_status,
        "current_version": get_model_version()
    }