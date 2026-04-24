# Requerimentos: pip install fastapi uvicorn pandas scikit-learn pydantic

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

app = FastAPI(title="OcianClub AI Service")

# Definição do formato de entrada (Payload enviado pelo Node.js)
class JogadorStats(BaseModel):
    jogador_id: int
    GOL: int = 0
    ASSISTENCIA: int = 0
    DESARME: int = 0
    CARTAO_AMARELO: int = 0
    CARTAO_VERMELHO: int = 0

class ResultadoPerfil(BaseModel):
    jogador_id: int
    perfil_ml: str

@app.post("/internal/ml/treinar-perfis", response_model=List[ResultadoPerfil])
def treinar_perfis(stats: List[JogadorStats]):
    if len(stats) < 3:
        # K-Means precisa de pelo menos n amostras (aqui, 3 clusters)
        raise HTTPException(status_code=400, detail="Dados insuficientes para treinar. Mínimo de 3 jogadores com eventos.")

    # 1. Converte JSON para DataFrame
    df = pd.DataFrame([s.dict() for s in stats])
    
    # Guarda os IDs para devolver depois e remove do treino
    ids = df['jogador_id'].values
    features = df.drop(columns=['jogador_id'])

    # 2 e 3. Filtra features numéricas e aplica StandardScaler
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)

    # 4. Executa KMeans(n_clusters=3)
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    
    # 5. Identifica clusters
    clusters = kmeans.fit_predict(features_scaled)

    # 6. Lógica Real de Interpretação dos Dados (Mapeamento baseado nos centróides)
    # Pegamos o "centro" matemático de cada cluster e revertemos a padronização para analisar os números reais
    centroids_reais = scaler.inverse_transform(kmeans.cluster_centers_)
    df_centroids = pd.DataFrame(centroids_reais, columns=features.columns)

    # Qual cluster é qual? Lógica de negócio real:
    # O cluster com a maior média de gols + assistências é o Ofensivo
    idx_ofensivo = (df_centroids['GOL'] + df_centroids['ASSISTENCIA']).idxmax()
    
    # O cluster com a maior média de desarmes é o Defensivo
    idx_defensivo = df_centroids['DESARME'].idxmax()

    # Prepara o dicionário com os nomes reais baseados no cálculo
    nomes_perfis = {}
    for i in range(3):
        if i == idx_ofensivo:
            nomes_perfis[i] = "Ofensivo"
        elif i == idx_defensivo and i != idx_ofensivo:
            nomes_perfis[i] = "Defensivo"
        else:
            nomes_perfis[i] = "Equilibrado"

    resultados = []
    for jogador_id, cluster_id in zip(ids, clusters):
        resultados.append(ResultadoPerfil(
            jogador_id=int(jogador_id),
            perfil_ml=nomes_perfis[cluster_id]
        ))

    return resultados

if __name__ == "__main__":
    import uvicorn
    # Roda o serviço isolado na porta 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)

# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# import pandas as pd
# from sklearn.cluster import KMeans
# from sklearn.preprocessing import StandardScaler

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# df_base = pd.read_csv('jogadores_stats.csv', encoding='utf-8')
# df_base.columns = df_base.columns.str.strip().str.lower()


# @app.get("/api/jogadores/perfis")
# def analisar_perfis_jogadores():
#     df = df_base.copy()

#     if 'perfil_ml' in df.columns:
#         return {
#             "total": len(df),
#             "jogadores": df.fillna("").to_dict(orient='records')
#         }

#     features = [
#         'gols',
#         'assistencias',
#         'desarmes',
#         'faltas_cometidas',
#         'faltas_sofridas'
#     ]

#     colunas_faltando = [f for f in features if f not in df.columns]
#     if colunas_faltando:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Colunas não encontradas: {colunas_faltando}"
#         )

#     df[features] = df[features].apply(pd.to_numeric, errors='coerce').fillna(0)

#     if 'jogos_disputados' in df.columns:
#         df['jogos_disputados'] = pd.to_numeric(df['jogos_disputados'], errors='coerce').replace(0, 1)
#         for col in ['gols', 'assistencias', 'desarmes']:
#             df[col] = df[col] / df['jogos_disputados']

#     n_clusters = min(3, len(df))
#     if n_clusters < 2:
#         raise HTTPException(
#             status_code=500,
#             detail="Poucos jogadores para análise"
#         )

#     X = df[features]
#     scaler = StandardScaler()
#     X_scaled = scaler.fit_transform(X)

#     kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
#     df['cluster'] = kmeans.fit_predict(X_scaled)

#     centroides = pd.DataFrame(
#         scaler.inverse_transform(kmeans.cluster_centers_),
#         columns=features
#     )

#     cluster_ofensivo = (centroides['gols'] + centroides['assistencias']).idxmax()
#     cluster_defensivo = centroides['desarmes'].idxmax()

#     def mapear_perfil(cluster_id):
#         if cluster_id == cluster_ofensivo:
#             return "Atacante"
#         elif cluster_id == cluster_defensivo:
#             return "Defensor"
#         else:
#             return "Versátil"

#     df['perfil_ml'] = df['cluster'].apply(mapear_perfil)

#     distribuicao = df['perfil_ml'].value_counts().to_dict()

#     df = df.drop(columns=['cluster'])
#     df = df.fillna("")

#     return {
#         "total": len(df),
#         "distribuicao": distribuicao,
#         "jogadores": df.to_dict(orient='records')
#     }