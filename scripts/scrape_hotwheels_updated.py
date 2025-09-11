import requests
from bs4 import BeautifulSoup
import re
import json

BASE_WIKI_URL = "https://hotwheels.fandom.com"

def get_model_urls_from_list_page(list_page_url):
    model_urls = []
    try:
        response = requests.get(list_page_url)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao acessar a URL da lista {list_page_url}: {e}")
        return model_urls

    soup = BeautifulSoup(response.text, 'html.parser')

    list_table = soup.find('table', class_='wikitable')
    if list_table:
        rows = list_table.find_all('tr')
        for row in rows[1:]:  # Skip header row
            cols = row.find_all(['td', 'th'])
            if len(cols) > 2: # Ensure there's at least a model name column
                model_name_cell = cols[2]
                link_tag = model_name_cell.find('a', href=True)
                if link_tag:
                    relative_url = link_tag['href']
                    full_url = f"{BASE_WIKI_URL}{relative_url}"
                    model_urls.append(full_url)
    return model_urls

def scrape_hotwheels_model(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao acessar a URL {url}: {e}")
        return [] # Return an empty list for consistency

    soup = BeautifulSoup(response.text, 'html.parser')

    all_versions_data = []

    model_name = None
    model_name_tag = soup.find('h1', class_='page-header__title')
    if model_name_tag:
        model_name = model_name_tag.text.strip()
        
    # Por padrão, as miniaturas raspadas não estão disponíveis para negociação
    # Esses campos serão preenchidos pelo usuário posteriormente

    # Extract Image URL (main image for the model)
    main_image_url = None
    image_tag = soup.find('figure', class_='pi-image-thumbnail')
    if image_tag and image_tag.find('img'):
        main_image_url = image_tag.find('img')['src']

    versions_table = soup.find('table', class_='wikitable')
    if versions_table:
        rows = versions_table.find_all('tr')
        if len(rows) > 0: # Check if there are any rows
            headers = [th.text.strip() for th in rows[0].find_all('th')]
            
            # Define a mapping from Wiki headers to miniatures_master columns
            # This makes the scraping more robust to column order changes
            header_to_column_map = {
                'Collection Number': 'collection_number',
                'Year': 'launch_year',
                'Series': 'series',
                'Color': 'base_color',
                'Details': 'variants',
                'Base Code': 'product_code',
                'Country': 'country_of_manufacture', # Not directly in miniatures_master, but useful for variants
                'Collector Number': 'collector_number' # If a specific column for this exists
            }

            for row in rows[1:]:  # Iterate over all data rows, skipping header
                cols = row.find_all(['td', 'th'])
                current_version_data = {
                    'model_name': model_name,
                    'brand': 'Hot Wheels',
                    'official_blister_photo_url': main_image_url,
                    'upc': None,
                    'assortment_number': None,
                    'batch_code': None,
                    'is_treasure_hunt': False,
                    'is_super_treasure_hunt': False
                }

                for i, header in enumerate(headers):
                    column_name = header_to_column_map.get(header)
                    if column_name and i < len(cols):
                        value = cols[i].text.strip()
                        if column_name == 'launch_year':
                            current_version_data[column_name] = int(value) if value.isdigit() else None
                        else:
                            current_version_data[column_name] = value if value else None
                
                # Special handling for collector_number from collection_number if not directly found
                if 'collection_number' in current_version_data and 'collector_number' not in current_version_data:
                    series_match = re.search(r'\d+/\d+\s*\((.*?)\)', current_version_data['collection_number'])
                    if series_match:
                        current_version_data['collector_number'] = series_match.group(1).strip()

                # Infer Treasure Hunt status from series or details
                series_text = current_version_data.get('series')
                variants_text = current_version_data.get('variants')
                
                if series_text and 'treasure hunt' in series_text.lower() or variants_text and 'treasure hunt' in variants_text.lower():
                    current_version_data['is_treasure_hunt'] = True
                if series_text and 'super treasure hunt' in series_text.lower() or variants_text and 'super treasure hunt' in variants_text.lower():
                    current_version_data['is_super_treasure_hunt'] = True

                # Adicionar campos de negociação com valores padrão
                current_version_data['disponivel_para_negocio'] = False
                current_version_data['preco_negociacao'] = None
                current_version_data['contato_negociacao'] = None
                current_version_data['observacoes_negociacao'] = None
                
                all_versions_data.append(current_version_data)

    return all_versions_data

from supabase import create_client, Client
import os
from dotenv import load_dotenv
import sys

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
# Usar a chave de serviço em vez da chave anônima para ignorar políticas RLS
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')  # Fallback para a chave anônima

def insert_car_to_supabase(car_data, dry_run=False):
    """
    Insere dados do carro na tabela 'miniatures_master' do Supabase
    
    Args:
        car_data (dict): Dados do carro a serem inseridos
        dry_run (bool): Se True, não insere dados no banco, apenas simula
    """
    if dry_run:
        print(f"[MODO TESTE] Simulando inserção de '{car_data.get('model_name')}'")
        return "test_id"
        
    try:
        print("\n=== INICIANDO INSERÇÃO NO SUPABASE ===")
        if not SUPABASE_URL or (not SUPABASE_SERVICE_KEY and not SUPABASE_KEY):
            print("Erro: Variáveis de ambiente do Supabase não encontradas")
            return None
        
        # Usar a chave de serviço se disponível, caso contrário usar a chave anônima
        key_to_use = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY
        key_type = "SERVICE KEY" if SUPABASE_SERVICE_KEY else "PUBLIC KEY"
        
        print(f"Conectando ao Supabase URL: {SUPABASE_URL}")
        print(f"Usando {key_type} para autenticação: {bool(key_to_use)}")
        supabase: Client = create_client(SUPABASE_URL, key_to_use)
        print("Cliente Supabase criado com sucesso")
        
        # Remover campos None
        insert_data = {k: v for k, v in car_data.items() if v is not None}
        print(f"Dados a serem inseridos: {insert_data['model_name']}")
        
        # Gerar o SQL INSERT para debug
        columns = ', '.join(insert_data.keys())
        placeholders = ', '.join([f"'{value}'" if isinstance(value, str) else str(value) for value in insert_data.values()])
        sql_insert = f"INSERT INTO public.miniatures_master ({columns}) VALUES ({placeholders});"
        print(f"SQL a ser executado: {sql_insert}")
        
        # Verificar se o carro já existe
        print(f"Verificando se '{insert_data['model_name']}' já existe...")
        model_name = insert_data['model_name']
        launch_year = insert_data.get('launch_year')
        series = insert_data.get('series', '')
        
        query = supabase.table('miniatures_master').select('id').eq('model_name', model_name)
        if launch_year:
            query = query.eq('launch_year', launch_year)
        if series:
            query = query.eq('series', series)
            
        existing = query.execute()
        print(f"Resultado da verificação: {existing}")
        
        if existing.data:
            print(f"Miniatura '{insert_data['model_name']}' já existe no banco de dados")
            return existing.data[0]['id']
        
        # Inserir nova miniatura
        print(f"Inserindo '{insert_data['model_name']}' no banco de dados...")
        try:
            result = supabase.table('miniatures_master').insert(insert_data).execute()
            print(f"Resultado da inserção: {result}")
            
            if result.data:
                print(f"Miniatura '{insert_data['model_name']}' inserida com sucesso")
                return result.data[0]['id']
            else:
                print(f"Erro ao inserir miniatura '{insert_data['model_name']}': Sem dados retornados")
                if hasattr(result, 'error'):
                    print(f"Erro: {result.error}")
                return None
        except Exception as insert_error:
            print(f"Exceção ao inserir miniatura '{insert_data['model_name']}': {insert_error}")
            import traceback
            print(traceback.format_exc())
            return None
            
    except Exception as e:
        print(f"Erro ao inserir dados no Supabase: {e}")
        import traceback
        print(traceback.format_exc())
        return None

if __name__ == '__main__':
    # Verificar se o script está sendo executado em modo de teste
    dry_run = '--dry-run' in sys.argv
    
    if dry_run:
        print("Executando em modo de teste (sem inserção no banco de dados)")
    
    # Usar uma URL específica para teste
    test_url = "https://hotwheels.fandom.com/wiki/Datsun_240Z"
    print(f"Testando com URL específica: {test_url}")
    
    all_cars_data = []
    successful_inserts = 0
    total_models = 0
    
    # Testar com apenas uma URL
    print(f"\nRaspando dados de: {test_url}")
    versions_data = scrape_hotwheels_model(test_url)
    if versions_data:
        all_cars_data.extend(versions_data)
        total_models += len(versions_data)
        
        # Inserir no Supabase ou simular inserção
        for car_data in versions_data:
            print("\n--- Detalhes do carro ---")
            for key, value in car_data.items():
                print(f"{key}: {value}")
            print("------------------------")
            
            car_id = insert_car_to_supabase(car_data, dry_run)
            if car_id:
                successful_inserts += 1
                print(f"Inserção bem-sucedida, ID: {car_id}")
            else:
                print("Falha na inserção!")
    else:
        print("Nenhum dado encontrado para esta URL.")
        
    # Verificar se o banco de dados está acessível
    if not dry_run:
        try:
            print("\nVerificando conexão com o banco de dados...")
            supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            test_query = supabase.table('miniatures_master').select('id').limit(1).execute()
            print(f"Resultado da consulta de teste: {test_query}")
        except Exception as e:
            print(f"Erro ao conectar ao banco de dados: {e}")


    print("\n--- Resumo da Operação ---")
    print(f"Total de modelos processados: {total_models}")
    print(f"Total de miniaturas {('simuladas' if dry_run else 'inseridas')}: {successful_inserts}/{total_models}")

    # Example of generating SQL INSERT statements
    if not dry_run:
        print("\n--- SQL INSERT Statements (Exemplo) ---")
        for car in all_cars_data:
            columns = []
            values = []
            for key, value in car.items():
                if value is not None:
                    columns.append(key)
                    if isinstance(value, str):
                        # Escape single quotes and handle potential double quotes within the string
                        escaped_value = value.replace("'", "''").replace('"', '""')
                        values.append(f"'{escaped_value}'")
                    else:
                        values.append(str(value))
            
            if columns and values:
                print(f"INSERT INTO public.miniatures_master ({', '.join(columns)}) VALUES ({', '.join(values)});")
