"""
seed_test_data.py
-----------------
Injecte 60 profils de test dans la base de données via l'API FastAPI.
L'API doit être démarrée sur http://127.0.0.1:8000 avant d'exécuter ce script.

Usage :
    python seed_test_data.py                  # Injecter les 60 profils
    python seed_test_data.py --reset          # Vider la DB puis injecter
    python seed_test_data.py --dry-run        # Afficher sans envoyer
    python seed_test_data.py --reset --dry-run
    python seed_test_data.py --url http://127.0.0.1:8000
"""

import requests
import time
import argparse
import sys
from sqlalchemy import create_engine, text

# ─────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────
DB_URL = "postgresql://postgres:postgres123@localhost:5432/score_credit_db"

# ─────────────────────────────────────────────────────────────
# 60 PROFILS DE TEST
# Format : (age_ans, anciennete_ans, revenu, credit, annuite,
#           prix_bien, contrat, genre_M, enfants, famille,
#           voiture, immo, ext2, ext3)
# contrat : 0=Cash, 1=Revolving
# genre   : 0=Femme, 1=Homme
# voiture / immo : 0=Non, 1=Oui
# ─────────────────────────────────────────────────────────────

PROFILS_ACCORDES = [
    (38, 10, 350000, 600000,  20000, 580000, 0, 0, 2, 4, 1, 1, 0.75, 0.70),
    (45, 15, 450000, 500000,  18000, 480000, 0, 1, 1, 3, 1, 1, 0.80, 0.75),
    (52, 20, 600000, 700000,  22000, 680000, 0, 0, 0, 2, 1, 1, 0.85, 0.80),
    (35,  8, 280000, 450000,  15000, 430000, 0, 1, 2, 4, 0, 1, 0.70, 0.65),
    (42, 12, 380000, 550000,  19000, 530000, 0, 0, 1, 3, 1, 1, 0.78, 0.72),
    (48, 18, 520000, 650000,  21000, 630000, 0, 1, 2, 4, 1, 1, 0.82, 0.77),
    (33,  7, 250000, 400000,  14000, 380000, 0, 0, 0, 1, 1, 0, 0.72, 0.68),
    (55, 25, 700000, 800000,  25000, 780000, 0, 1, 1, 3, 1, 1, 0.88, 0.83),
    (40, 11, 320000, 480000,  16000, 460000, 0, 0, 2, 4, 0, 1, 0.68, 0.63),
    (47, 17, 480000, 620000,  20000, 600000, 0, 1, 0, 2, 1, 1, 0.76, 0.71),
    (36,  9, 290000, 430000,  15500, 410000, 0, 0, 1, 3, 1, 0, 0.74, 0.69),
    (50, 22, 580000, 720000,  23000, 700000, 0, 1, 2, 4, 1, 1, 0.84, 0.79),
    (43, 13, 400000, 560000,  18500, 540000, 0, 0, 0, 2, 0, 1, 0.71, 0.66),
    (38, 10, 340000, 490000,  16500, 470000, 0, 1, 1, 3, 1, 1, 0.77, 0.72),
    (44, 14, 420000, 580000,  19500, 560000, 0, 0, 2, 4, 1, 1, 0.79, 0.74),
    (57, 28, 750000, 850000,  26000, 830000, 0, 1, 0, 2, 1, 1, 0.90, 0.85),
    (32,  6, 240000, 380000,  13500, 360000, 0, 0, 1, 3, 0, 0, 0.65, 0.60),
    (49, 19, 500000, 640000,  21500, 620000, 0, 1, 2, 4, 1, 1, 0.83, 0.78),
    (41, 11, 330000, 470000,  16000, 450000, 0, 0, 0, 2, 1, 0, 0.73, 0.68),
    (46, 16, 460000, 610000,  20500, 590000, 0, 1, 1, 3, 1, 1, 0.80, 0.75),
    (39, 10, 310000, 460000,  15500, 440000, 0, 0, 2, 4, 0, 1, 0.69, 0.64),
    (53, 23, 620000, 730000,  23500, 710000, 0, 1, 0, 2, 1, 1, 0.86, 0.81),
    (37,  9, 270000, 420000,  14500, 400000, 0, 0, 1, 3, 1, 0, 0.73, 0.68),
    (51, 21, 560000, 700000,  22500, 680000, 0, 1, 2, 4, 1, 1, 0.85, 0.80),
    (34,  7, 260000, 390000,  14000, 370000, 0, 0, 0, 1, 0, 0, 0.66, 0.61),
    (45, 15, 440000, 590000,  20000, 570000, 0, 1, 1, 3, 1, 1, 0.81, 0.76),
    (42, 12, 370000, 520000,  17500, 500000, 0, 0, 2, 4, 1, 1, 0.76, 0.71),
    (58, 30, 800000, 900000,  28000, 880000, 0, 1, 0, 2, 1, 1, 0.92, 0.87),
    (36,  8, 280000, 440000,  15000, 420000, 0, 0, 1, 3, 0, 1, 0.70, 0.65),
    (48, 18, 510000, 660000,  21000, 640000, 0, 1, 2, 4, 1, 1, 0.82, 0.77),
]

PROFILS_REFUSES = [
    (22, 1,  70000,  800000, 65000, 750000, 1, 1, 0, 1, 0, 0, 0.08, 0.05),
    (24, 1,  60000,  900000, 75000, 850000, 1, 0, 0, 1, 0, 0, 0.05, 0.05),
    (23, 1,  80000,  700000, 60000, 680000, 1, 1, 1, 2, 0, 0, 0.10, 0.08),
    (21, 1,  55000,  950000, 80000, 920000, 1, 0, 0, 1, 0, 0, 0.04, 0.03),
    (25, 1,  75000,  850000, 70000, 820000, 1, 1, 0, 1, 0, 0, 0.07, 0.06),
    (65, 1,  90000, 1200000, 95000,1100000, 1, 0, 4, 6, 0, 0, 0.10, 0.10),
    (60, 1,  85000, 1100000, 90000,1050000, 1, 1, 3, 5, 0, 0, 0.08, 0.07),
    (55, 1,  95000, 1000000, 85000, 980000, 1, 0, 4, 6, 0, 0, 0.12, 0.09),
    (19, 1,  50000,  600000, 55000, 580000, 1, 1, 0, 1, 0, 0, 0.06, 0.05),
    (20, 1,  65000,  750000, 62000, 720000, 1, 0, 0, 1, 0, 0, 0.09, 0.07),
    (22, 1,  68000,  780000, 64000, 760000, 1, 1, 0, 1, 0, 0, 0.08, 0.06),
    (63, 1,  88000, 1150000, 92000,1080000, 1, 0, 3, 5, 0, 0, 0.09, 0.08),
    (24, 1,  72000,  820000, 68000, 800000, 1, 1, 1, 2, 0, 0, 0.11, 0.09),
    (21, 1,  58000,  880000, 73000, 860000, 1, 0, 0, 1, 0, 0, 0.05, 0.04),
    (23, 1,  62000,  920000, 76000, 890000, 1, 1, 0, 1, 0, 0, 0.06, 0.05),
    (62, 1,  82000, 1080000, 88000,1020000, 1, 0, 4, 6, 0, 0, 0.08, 0.07),
    (20, 1,  59000,  760000, 63000, 740000, 1, 1, 0, 1, 0, 0, 0.07, 0.05),
    (25, 1,  77000,  870000, 72000, 840000, 1, 0, 1, 2, 0, 0, 0.10, 0.08),
    (64, 1,  86000, 1180000, 94000,1120000, 1, 1, 3, 5, 0, 0, 0.09, 0.08),
    (19, 1,  52000,  650000, 57000, 630000, 1, 0, 0, 1, 0, 0, 0.05, 0.04),
]

PROFILS_LIMITES = [
    (35, 2, 150000, 600000, 35000, 580000, 0, 1, 1, 3, 1, 0, 0.45, 0.40),
    (28, 3, 180000, 450000, 22000, 430000, 0, 0, 0, 1, 0, 0, 0.55, 0.50),
    (30, 2, 160000, 500000, 28000, 480000, 1, 1, 2, 4, 0, 1, 0.42, 0.38),
    (27, 1, 140000, 550000, 32000, 530000, 1, 0, 1, 2, 0, 0, 0.48, 0.44),
    (33, 3, 170000, 480000, 25000, 460000, 0, 1, 0, 2, 1, 0, 0.52, 0.47),
    (29, 2, 155000, 520000, 30000, 500000, 0, 0, 1, 3, 0, 1, 0.46, 0.41),
    (31, 2, 165000, 470000, 24000, 450000, 1, 1, 2, 4, 0, 0, 0.50, 0.45),
    (26, 1, 135000, 580000, 34000, 560000, 1, 0, 0, 1, 0, 0, 0.54, 0.49),
    (34, 3, 175000, 460000, 23000, 440000, 0, 1, 1, 2, 1, 0, 0.44, 0.39),
    (32, 2, 158000, 510000, 29000, 490000, 0, 0, 2, 3, 0, 0, 0.49, 0.44),
]


# ─────────────────────────────────────────────────────────────
# FONCTIONS
# ─────────────────────────────────────────────────────────────

def reset_db():
    """Vide directement les tables predictions et actions_log via PostgreSQL."""
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE predictions RESTART IDENTITY CASCADE"))
            conn.execute(text("TRUNCATE TABLE actions_log RESTART IDENTITY CASCADE"))
            conn.commit()
        engine.dispose()
        print("  ✅ Base de données vidée\n")
        return True
    except Exception as e:
        print(f"  ❌ Erreur reset DB : {e}")
        return False


def profil_to_payload(p):
    """Convertit un tuple profil en payload JSON pour l'API."""
    age, anc, revenu, credit, annuite, prix, contrat, genre, enfants, famille, voiture, immo, ext2, ext3 = p
    anciennete_ajustee = max(anc, 0.1)
    return {
        "AMT_INCOME_TOTAL": float(revenu),
        "AMT_CREDIT": float(credit),
        "AMT_ANNUITY": float(annuite),
        "AMT_GOODS_PRICE": float(prix),
        "DAYS_BIRTH": int(age * -365),
        "DAYS_EMPLOYED": int(anciennete_ajustee * -365),
        "EXT_SOURCE_2": float(ext2),
        "EXT_SOURCE_3": float(ext3),
        "CNT_CHILDREN": int(enfants),
        "CNT_FAM_MEMBERS": float(famille),
        "NAME_CONTRACT_TYPE": int(contrat),
        "FLAG_OWN_CAR": int(voiture),
        "FLAG_OWN_REALTY": int(immo),
        "CODE_GENDER_M": int(genre),
    }


def envoyer_profil(url, payload, numero, label):
    """Envoie un profil à l'API et retourne la décision."""
    try:
        resp = requests.post(f"{url}/api/predict", json=payload, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            decision = data.get("decision", "?")
            proba = data.get("probabilite_defaut", 0)
            risque = data.get("niveau_risque", "?")
            print(f"  [{numero:02d}] {label:<12} → {decision:<8} | {proba:5.1f}% | {risque}")
            return True
        else:
            print(f"  [{numero:02d}] {label:<12} → ❌ Erreur {resp.status_code}: {resp.text[:80]}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"  [{numero:02d}] ❌ Impossible de joindre l'API sur {url}")
        print("      Vérifiez que uvicorn tourne : uvicorn api.main:app --reload --port 8000")
        return False
    except Exception as e:
        print(f"  [{numero:02d}] ❌ Erreur : {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Injection des 60 profils de test")
    parser.add_argument("--url", default="http://127.0.0.1:8000", help="URL de l'API FastAPI")
    parser.add_argument("--reset", action="store_true", help="Vider la DB avant injection")
    parser.add_argument("--dry-run", action="store_true", help="Affiche les payloads sans envoyer")
    parser.add_argument("--delay", type=float, default=0.3, help="Délai entre chaque requête (secondes)")
    args = parser.parse_args()

    print("=" * 60)
    print("  INJECTION DES DONNÉES DE TEST — Score Crédit MLOps")
    print("=" * 60)
    print(f"  API     : {args.url}")
    print(f"  Profils : 30 accordés + 20 refusés + 10 cas limites = 60")
    print(f"  Reset   : {'OUI — la DB sera vidée avant injection' if args.reset else 'NON'}")
    print(f"  Mode    : {'DRY RUN (aucune donnée envoyée)' if args.dry_run else 'ENVOI RÉEL'}")
    print("=" * 60)

    if not args.dry_run:

        # Vérifier que l'API est disponible
        try:
            resp = requests.get(f"{args.url}/api/health", timeout=5)
            if resp.status_code == 200:
                print("  ✅ API disponible")
            else:
                print(f"  ⚠️ API répond avec code {resp.status_code}")
        except Exception:
            print(f"  ❌ API non disponible sur {args.url}")
            print("  Lancez d'abord : uvicorn api.main:app --reload --port 8000")
            sys.exit(1)

        # Reset DB si demandé
        if args.reset:
            print("  🗑️  Vidage de la base de données...")
            if not reset_db():
                sys.exit(1)
        else:
            print()

    ok = 0
    ko = 0
    num = 1

    # ── ACCORDÉS ──
    print("📗 PROFILS ACCORDÉS (30)")
    print("-" * 60)
    for p in PROFILS_ACCORDES:
        payload = profil_to_payload(p)
        if args.dry_run:
            print(f"  [{num:02d}] DRY — age={p[0]}ans revenu={p[2]:,} credit={p[3]:,} ext2={p[12]}")
            ok += 1
        else:
            success = envoyer_profil(args.url, payload, num, "ACCORDÉ")
            ok += 1 if success else 0
            ko += 0 if success else 1
            time.sleep(args.delay)
        num += 1

    # ── REFUSÉS ──
    print("\n📕 PROFILS REFUSÉS (20)")
    print("-" * 60)
    for p in PROFILS_REFUSES:
        payload = profil_to_payload(p)
        if args.dry_run:
            print(f"  [{num:02d}] DRY — age={p[0]}ans revenu={p[2]:,} credit={p[3]:,} ext2={p[12]}")
            ok += 1
        else:
            success = envoyer_profil(args.url, payload, num, "REFUSÉ")
            ok += 1 if success else 0
            ko += 0 if success else 1
            time.sleep(args.delay)
        num += 1

    # ── CAS LIMITES ──
    print("\n📙 CAS LIMITES (10)")
    print("-" * 60)
    for p in PROFILS_LIMITES:
        payload = profil_to_payload(p)
        if args.dry_run:
            print(f"  [{num:02d}] DRY — age={p[0]}ans revenu={p[2]:,} credit={p[3]:,} ext2={p[12]}")
            ok += 1
        else:
            success = envoyer_profil(args.url, payload, num, "LIMITE")
            ok += 1 if success else 0
            ko += 0 if success else 1
            time.sleep(args.delay)
        num += 1

    # ── RÉSUMÉ ──
    print("\n" + "=" * 60)
    if args.dry_run:
        print(f"  DRY RUN terminé — {ok} profils prêts à être envoyés")
        print(f"  Lancez sans --dry-run pour envoyer réellement")
    else:
        print(f"  ✅ Succès : {ok} / 60")
        if ko > 0:
            print(f"  ❌ Échecs : {ko} / 60")
        print(f"  📊 Données visibles sur : http://localhost:5173")
    print("=" * 60)


if __name__ == "__main__":
    main()