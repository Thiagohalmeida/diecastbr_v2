import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import sys

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Configuração do Supabase
# Usando a chave de serviço (service_role) em vez da chave anônima
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Precisamos adicionar esta variável ao .env

# Verificar se as variáveis de ambiente estão definidas
if not SUPABASE_URL:
    print("Erro: URL do Supabase não encontrada")
    exit(1)

# Verificar se temos a chave de serviço ou usar a chave anônima como fallback
if not SUPABASE_SERVICE_KEY:
    print("Aviso: Chave de serviço do Supabase não encontrada. Usando chave anônima como fallback.")
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_KEY')
    if not SUPABASE_SERVICE_KEY:
        print("Erro: Nenhuma chave do Supabase encontrada")
        exit(1)
    print("Nota: A chave anônima pode não ter permissões suficientes devido às políticas RLS")

# Criar cliente Supabase com a chave de serviço
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Dados de exemplo para importação
sample_data = [
    {
        "model_name": "Skyline GT-R (R34)",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "01/10",
        "base_color": "Blue",
        "disponivel_para_negocio": True,
        "preco_negociacao": 150.00,
        "contato_negociacao": "email@exemplo.com",
        "observacoes_negociacao": "Aceito troca por outros modelos JDM"
    },
    {
        "model_name": "Toyota Supra MK4",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "02/10",
        "base_color": "Orange",
        "disponivel_para_negocio": False
    },
    {
        "model_name": "Honda NSX Type-R",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "03/10",
        "base_color": "Red"
    },
    {
        "model_name": "Mazda RX-7 FD",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "04/10",
        "base_color": "Yellow"
    },
    {
        "model_name": "Mitsubishi Lancer Evolution VII",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "05/10",
        "base_color": "Silver"
    }
]

# Verificar se deve executar em modo de teste
dry_run = '--dry-run' in sys.argv

# Contador de inserções bem-sucedidas
successful_inserts = 0

# Inserir no Supabase
print(f"\n=== INSERINDO {len(sample_data)} MINIATURAS NO SUPABASE (COM CHAVE DE SERVIÇO) ===\n")
for miniatura in sample_data:
    try:
        # Mapear campos para o formato do Supabase
        insert_data = {
            "model_name": miniatura["model_name"],
            "brand": miniatura["brand"],
            "launch_year": miniatura["launch_year"],
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
                if hasattr(result, 'error'):
                    print(f"   Erro: {result.error}")
    except Exception as e:
        print(f"❌ Erro ao processar miniatura '{miniatura.get('model_name')}': {e}")

print(f"\n=== RESUMO DA OPERAÇÃO ===")
print(f"Total de miniaturas processadas: {len(sample_data)}")
print(f"Total de miniaturas {('simuladas' if dry_run else 'inseridas')}: {successful_inserts}/{len(sample_data)}")
