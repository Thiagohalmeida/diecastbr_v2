import requests
import json
import os
from dotenv import load_dotenv
import sys

# Carregar variáveis de ambiente
load_dotenv()

# Configuração da API
API_URL = "http://localhost:8000"
API_USERNAME = os.getenv('API_USERNAME', 'admin')
API_PASSWORD = os.getenv('API_PASSWORD', 'password')

# Verificar se deve executar em modo de teste
dry_run = '--dry-run' in sys.argv

# Dados de exemplo para importação
sample_data = [
    {
        "model_name": "Skyline GT-R (R34)",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "01/10",
        "base_color": "Blue",
        "visibility": "public"
    },
    {
        "model_name": "Toyota Supra MK4",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "02/10",
        "base_color": "Orange",
        "visibility": "public"
    },
    {
        "model_name": "Honda NSX Type-R",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "03/10",
        "base_color": "Red",
        "visibility": "public"
    },
    {
        "model_name": "Mazda RX-7 FD",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "04/10",
        "base_color": "Yellow",
        "visibility": "public"
    },
    {
        "model_name": "Mitsubishi Lancer Evolution VII",
        "brand": "Fast Wheels",
        "launch_year": 2023,
        "series": "JDM Legends",
        "collection_number": "05/10",
        "base_color": "Silver",
        "visibility": "public"
    }
]

# Função para testar a conexão com a API
def test_api_connection():
    try:
        response = requests.get(f"{API_URL}/")
        if response.status_code == 200:
            print("✅ Conexão com a API bem-sucedida")
            return True
        else:
            print(f"❌ Erro ao conectar à API: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro ao conectar à API: {e}")
        return False

# Função para inserir uma miniatura
def insert_miniature(miniature):
    try:
        if dry_run:
            print(f"[MODO TESTE] Simulando inserção de '{miniature['model_name']}'")
            return True
        
        response = requests.post(
            f"{API_URL}/miniatures",
            json=miniature,
            auth=(API_USERNAME, API_PASSWORD)
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Miniatura '{miniature['model_name']}' inserida com sucesso")
                return True
            else:
                print(f"❌ Erro ao inserir miniatura '{miniature['model_name']}': {result.get('message')}")
                return False
        else:
            print(f"❌ Erro ao inserir miniatura '{miniature['model_name']}': {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Erro ao inserir miniatura '{miniature.get('model_name')}': {e}")
        return False

# Função para inserir múltiplas miniaturas em lote
def insert_miniatures_batch(miniatures):
    try:
        if dry_run:
            print(f"[MODO TESTE] Simulando inserção em lote de {len(miniatures)} miniaturas")
            for miniature in miniatures:
                print(f"  - {miniature['model_name']}")
            return len(miniatures)
        
        response = requests.post(
            f"{API_URL}/miniatures/batch",
            json=miniatures,
            auth=(API_USERNAME, API_PASSWORD)
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Processamento em lote concluído")
            print(f"  - Total: {result.get('total')}")
            print(f"  - Sucesso: {result.get('successful')}")
            print(f"  - Falhas: {result.get('failed')}")
            
            # Exibir detalhes das falhas, se houver
            if result.get('failed') > 0:
                print("\nDetalhes das falhas:")
                for detail in result.get('details', []):
                    if not detail.get('success'):
                        print(f"  - {detail.get('model_name')}: {detail.get('message')}")
            
            return result.get('successful', 0)
        else:
            print(f"❌ Erro ao processar lote: {response.status_code}")
            print(response.text)
            return 0
    except Exception as e:
        print(f"❌ Erro ao processar lote: {e}")
        return 0

# Função principal
def main():
    print("\n=== TESTE DE CLIENTE API DIECAST BR GARAGE ===\n")
    
    # Testar conexão com a API
    if not test_api_connection():
        print("Não foi possível conectar à API. Verifique se o servidor está em execução.")
        print(f"URL da API: {API_URL}")
        exit(1)
    
    # Escolher método de inserção
    use_batch = input("\nDeseja usar inserção em lote? (s/n): ").lower() == 's'
    
    # Contador de inserções bem-sucedidas
    successful_inserts = 0
    
    if use_batch:
        # Inserir miniaturas em lote
        print(f"\n=== INSERINDO {len(sample_data)} MINIATURAS EM LOTE ===\n")
        successful_inserts = insert_miniatures_batch(sample_data)
    else:
        # Inserir miniaturas individualmente
        print(f"\n=== INSERINDO {len(sample_data)} MINIATURAS INDIVIDUALMENTE ===\n")
        for miniature in sample_data:
            if insert_miniature(miniature):
                successful_inserts += 1
    
    # Exibir resumo
    print(f"\n=== RESUMO DA OPERAÇÃO ===")
    print(f"Total de miniaturas processadas: {len(sample_data)}")
    print(f"Total de miniaturas {('simuladas' if dry_run else 'inseridas')}: {successful_inserts}/{len(sample_data)}")

# Executar o programa
if __name__ == "__main__":
    main()
