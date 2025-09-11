import requests
import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import sys

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Verificar se as variáveis de ambiente estão definidas
if not SUPABASE_URL or not SUPABASE_KEY:
    print("Erro: Variáveis de ambiente do Supabase não encontradas")
    exit(1)

# Criar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# API base (exemplo: https://fastwheelsapi.joedots1.repl.co/car/2018)
API_BASE = "https://fastwheelsapi.joedots1.repl.co/car/"

# Período de interesse (pode mudar)
anos = list(range(2010, 2021))

# Lista para os resultados
miniaturas = []

for ano in anos:
    print(f"Baixando ano {ano}...")
    url = f"{API_BASE}{ano}"
    resp = requests.get(url)
    if resp.status_code != 200:
        print(f"Erro ao buscar {url}")
        continue
    carros = resp.json()
    for car in carros:
        mini = {
            "model_name": car.get("name", "").strip().upper(),
            "brand": car.get("manufacturer", "").strip().title(),
            "base_color": car.get("color", "").strip().title(),
            "year": car.get("year", ano),
            "series": car.get("series", "").strip().title(),
            "collection_number": car.get("number", "").strip(),
            "upc": car.get("upc", "").strip()
        }
        # Remove modelos incompletos
        if mini["model_name"]:
            miniaturas.append(mini)

# Remove duplicados (por model_name, brand e year)
seen = set()
unique_miniaturas = []
for m in miniaturas:
    key = (m["model_name"], m["brand"], m["year"])
    if key not in seen:
        seen.add(key)
        unique_miniaturas.append(m)

# Verificar se deve executar em modo de teste
dry_run = '--dry-run' in sys.argv

# Contador de inserções bem-sucedidas
successful_inserts = 0

# Inserir no Supabase
print(f"\n=== INSERINDO {len(unique_miniaturas)} MINIATURAS NO SUPABASE ===\n")
for miniatura in unique_miniaturas:
    try:
        # Mapear campos para o formato do Supabase
        insert_data = {
            "model_name": miniatura["model_name"],
            "brand": miniatura["brand"] or "Fast Wheels",
            "launch_year": miniatura["year"],
            "series": miniatura["series"],
            "collection_number": miniatura["collection_number"],
            "base_color": miniatura["base_color"]
        }
        
        # Remover campos None ou vazios
        insert_data = {k: v for k, v in insert_data.items() if v}
        
        # Verificar se a miniatura já existe
        model_name = insert_data['model_name']
        launch_year = insert_data.get('launch_year')
        series = insert_data.get('series', '')
        
        query = supabase.table('miniatures_master').select('id').eq('model_name', model_name)
        if launch_year:
            query = query.eq('launch_year', launch_year)
        if series:
            query = query.eq('series', series)
            
        existing = query.execute()
        
        if existing.data:
            print(f"Miniatura '{model_name}' já existe no banco de dados")
            continue
        
        # Inserir nova miniatura
        if dry_run:
            print(f"[MODO TESTE] Simulando inserção de '{model_name}'")
            successful_inserts += 1
        else:
            print(f"Inserindo '{model_name}' no banco de dados...")
            result = supabase.table('miniatures_master').insert(insert_data).execute()
            
            if result.data:
                print(f"✅ Miniatura '{model_name}' inserida com sucesso")
                successful_inserts += 1
            else:
                print(f"❌ Erro ao inserir miniatura '{model_name}': Sem dados retornados")
    except Exception as e:
        print(f"❌ Erro ao processar miniatura '{miniatura.get('model_name')}': {e}")

# Salvar também em JSON como backup
with open("fast_wheels_lookup.json", "w", encoding="utf-8") as f:
    json.dump(unique_miniaturas, f, ensure_ascii=False, indent=2)

print(f"\n=== RESUMO DA OPERAÇÃO ===")
print(f"Total de miniaturas processadas: {len(unique_miniaturas)}")
print(f"Total de miniaturas {('simuladas' if dry_run else 'inseridas')}: {successful_inserts}/{len(unique_miniaturas)}")
print(f"Backup salvo em: fast_wheels_lookup.json")
