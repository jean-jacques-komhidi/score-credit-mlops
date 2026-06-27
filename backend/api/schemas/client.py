from pydantic import BaseModel
from typing import Optional

class ClientData(BaseModel):
    AMT_INCOME_TOTAL: float
    AMT_CREDIT: float
    AMT_ANNUITY: float
    AMT_GOODS_PRICE: float
    DAYS_BIRTH: int
    DAYS_EMPLOYED: int
    EXT_SOURCE_2: float
    EXT_SOURCE_3: float
    CNT_CHILDREN: int
    CNT_FAM_MEMBERS: float
    NAME_CONTRACT_TYPE: int      # 0 ou 1
    FLAG_OWN_CAR: int            # 0 ou 1
    FLAG_OWN_REALTY: int         # 0 ou 1
    CODE_GENDER_M: int           # 0 ou 1

class PredictionResponse(BaseModel):
    score: float
    probabilite_defaut: float
    decision: str
    niveau_risque: str
    score_metier: float