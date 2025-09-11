from supabase import create_client
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Consultar a tabela miniatures_master
result = supabase.table('miniatures_master').select('*').execute()

print(f'Total de miniaturas no banco: {len(result.data)}')

if result.data:
    print('\nÚltimas 5 miniaturas adicionadas:')
    for item in result.data[-5:]:
        print(f'- {item.get("model_name")} ({item.get("brand")}) - {item.get("launch_year")}')
else:
    print('\nNenhuma miniatura encontrada no banco de dados.')
