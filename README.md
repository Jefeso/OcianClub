# Como rodar o projeto

O sistema possui 3 serviços. Rode cada um em um terminal separado.

---

## 1. Backend de IA (Python)

Responsável por processar dados e gerar perfis dos jogadores.

cd backend-ml
pip install fastapi uvicorn pandas scikit-learn
uvicorn main:app --reload

Roda em: http://localhost:8000

---

## 2. Backend Node (API + Banco)

Antes de iniciar, crie um arquivo .env em backend-node com:
- DATABASE_URL
- DIRECT_URL

cd backend-node
npm install
npx prisma generate
npx tsx src/server.ts

Roda em: http://localhost:3000

---

## 3. App Mobile (Expo)

cd cfaocian
npm install
npx expo start

Abra no celular com Expo Go ou use emulador Android.

---

# Banco de Dados (Prisma)

Não alterar diretamente no Supabase. Tudo deve ser feito via código.

---

## Após dar git pull

Atualize o Prisma:

npx prisma generate

---

## Criar ou alterar tabelas

1. Edite:
prisma/schema.prisma

2. Rode:
npx prisma migrate dev --name nome_da_alteracao

3. Commit e push das alterações

---

# Observações

- Cada serviço tem suas próprias dependências  
- Sempre rodar npm install ou pip install ao entrar no projeto  
- Backend Node depende do .env configurado corretamente  