import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import sys
import getpass

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

# Autenticar usuário
def authenticate_user():
    print("\n=== AUTENTICAÇÃO SUPABASE ===")
    print("Para inserir dados, você precisa se autenticar.")
    
    # Verificar se há credenciais salvas em variáveis de ambiente
    email = os.getenv('SUPABASE_AUTH_EMAIL')
    password = os.getenv('SUPABASE_AUTH_PASSWORD')
    
    # Se não houver credenciais salvas, solicitar ao usuário
    if not email or not password:
        email = input("Email: ")
        password = getpass.getpass("Senha: ")
    
    try:
        # Tentar fazer login
        response = supabase.auth.sign_in_with_password({"email": email, "password": password})
        user = response.user
        print(f"✅ Autenticado como {user.email}")
        return True
    except Exception as e:
        print(f"❌ Erro de autenticação: {e}")
        return False

# Dados de exemplo para importação
sample_data = [
    {
        "model_name": "Skyline GT-R (R34)",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "01/10",
        "base_color": "Blue"
    },
    {
        "model_name": "Toyota Supra MK4",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "02/10",
        "base_color": "Orange"
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

# Autenticar usuário antes de prosseguir
if not authenticate_user():
    print("Autenticação falhou. Não é possível inserir dados.")
    exit(1)

# Contador de inserções bem-sucedidas
successful_inserts = 0

# Inserir no Supabase
print(f"\n=== INSERINDO {len(sample_data)} MINIATURAS NO SUPABASE (COM AUTENTICAÇÃO) ===\n")
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
