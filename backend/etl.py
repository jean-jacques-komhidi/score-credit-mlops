import pandas as pd
from sqlalchemy import create_engine

# Connexion a score_credit_db
engine = create_engine('postgresql://postgres:postgres123@localhost:5432/score_credit_db')

# Charger le CSV
print('Chargement du CSV...')
df = pd.read_csv('data/application_train.csv')
print(f'Dataset charge : {df.shape[0]} lignes x {df.shape[1]} colonnes')

# Importer dans PostgreSQL
print('Importation dans PostgreSQL...')
df.to_sql('application_train', engine, if_exists='replace', index=False, chunksize=1000)
print('✅ Table application_train creee avec succes dans score_credit_db !')