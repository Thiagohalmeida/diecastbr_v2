import requests
from bs4 import BeautifulSoup
import re
import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Erro: Variáveis de ambiente do Supabase não encontradas")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_hotwheels_model(url):
    """
    Scrape dados de um modelo Hot Wheels da wiki
    """
    try:
        # Remover aspas simples que podem estar na URL
        url = url.strip("' `")
        print(f"Acessando URL: {url}")
        response = requests.get(url)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)
    except requests.exceptions.RequestException as e:
        print(f"Erro ao acessar a URL {url}: {e}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')

    car_data = {}

    # Extract Model Name
    model_name_tag = soup.find('h1', class_='page-header__title')
    if model_name_tag:
        car_data['model_name'] = model_name_tag.text.strip()
    else:
        car_data['model_name'] = None

    car_data['brand'] = 'Hot Wheels'

    # Extract details from the 'Versions' table
    versions_table = soup.find('table', class_='wikitable')
    if versions_table:
        rows = versions_table.find_all('tr')
        if len(rows) > 1: # Skip header row
            # Assuming the first data row contains the most relevant info for a single entry
            # This might need refinement for multiple versions on the same page
            first_version_row = rows[1]
            cols = first_version_row.find_all(['td', 'th'])
            
            # This mapping is based on the Datsun 240Z page structure and might need adjustments
            # Index 0: Collection Number (e.g., 062/250)
            # Index 1: Year (e.g., 2025)
            # Index 2: Series (e.g., HW Art Cars)
            # Index 3: Color (e.g., Pearl light blue)
            # Index 4: Details (e.g., Cherry blossom branches...)
            # Index 9: Base Code (e.g., JJB80)
            # Index 10: Country of Manufacture (e.g., Malaysia)

            if len(cols) > 10:
                car_data['collection_number'] = cols[0].text.strip() if cols[0].text.strip() else None
                car_data['launch_year'] = int(cols[1].text.strip()) if cols[1].text.strip().isdigit() else None
                car_data['series'] = cols[2].text.strip() if cols[2].text.strip() else None
                car_data['base_color'] = cols[3].text.strip() if cols[3].text.strip() else None
                car_data['variants'] = cols[4].text.strip() if cols[4].text.strip() else None
                car_data['product_code'] = cols[9].text.strip() if cols[9].text.strip() else None
                # country_of_manufacture is not directly in miniatures_master, can be added to variants or ignored
                # car_data['country_of_manufacture'] = cols[10].text.strip() if cols[10].text.strip() else None

                # Extract collector_number from collection_number if available (e.g., 4/10 from 82/250, 4/10)
                series_match = re.search(r'\d+/\d+\s*\((.*?)\)', car_data.get('collection_number', ''))
                if series_match:
                    car_data['collector_number'] = series_match.group(1).strip()
                else:
                    car_data['collector_number'] = None

    # Extract Image URL
    image_tag = soup.find('figure', class_='pi-image-thumbnail')
    if image_tag and image_tag.find('img'):
        car_data['official_blister_photo_url'] = image_tag.find('img')['src']
    else:
        car_data['official_blister_photo_url'] = None

    # Set other fields to None as they are not directly scraped from Hot Wheels Wiki
    car_data['upc'] = None
    car_data['assortment_number'] = None
    car_data['batch_code'] = None
    car_data['is_treasure_hunt'] = False # Default to False, needs specific logic to determine
    car_data['is_super_treasure_hunt'] = False # Default to False, needs specific logic to determine

    return car_data

def insert_car_to_supabase(car_data):
    """
    Insere dados do carro na tabela 'miniatures_master' do Supabase
    """
    try:
        # Preparar dados para inserção - os campos já estão no formato correto da tabela
        insert_data = {
            'model_name': car_data.get('model_name'),
            'brand': car_data.get('brand', 'Hot Wheels'),
            'launch_year': car_data.get('launch_year'),
            'series': car_data.get('series'),
            'base_color': car_data.get('base_color'),
            'collection_number': car_data.get('collection_number'),
            'collector_number': car_data.get('collector_number'),
            'official_blister_photo_url': car_data.get('official_blister_photo_url'),
            'variants': car_data.get('variants'),
            'product_code': car_data.get('product_code'),
            'upc': car_data.get('upc'),
            'assortment_number': car_data.get('assortment_number'),
            'batch_code': car_data.get('batch_code'),
            'is_treasure_hunt': car_data.get('is_treasure_hunt', False),
            'is_super_treasure_hunt': car_data.get('is_super_treasure_hunt', False)
        }
        
        # Remover campos None
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        
        # Verificar se o carro já existe
        existing = supabase.table('miniatures_master').select('id').eq('model_name', insert_data['model_name']).execute()
        
        if existing.data:
            print(f"Miniatura '{insert_data['model_name']}' já existe no banco de dados")
            return existing.data[0]['id']
        
        # Inserir nova miniatura
        result = supabase.table('miniatures_master').insert(insert_data).execute()
        
        if result.data:
            print(f"Miniatura '{insert_data['model_name']}' inserida com sucesso")
            return result.data[0]['id']
        else:
            print(f"Erro ao inserir miniatura '{insert_data['model_name']}'")
            return None
            
    except Exception as e:
        print(f"Erro ao inserir dados no Supabase: {e}")
        return None

def scrape_and_populate_database(dry_run=False):
    """
    Função principal para fazer scraping e popular o banco de dados
    
    Args:
        dry_run (bool): Se True, não insere dados no banco, apenas simula
    """
    sample_urls = [
        'https://hotwheels.fandom.com/wiki/Datsun_240Z',
        'https://hotwheels.fandom.com/wiki/Custom_%2771_Datsun_240Z',
        'https://hotwheels.fandom.com/wiki/%2769_Chevelle_SS_396',
        'https://hotwheels.fandom.com/wiki/Bone_Shaker',
        'https://hotwheels.fandom.com/wiki/Porsche_911_Carrera_RS_2.7'
    ]

    successful_inserts = 0
    total_urls = len(sample_urls)

    print(f"Iniciando scraping de {total_urls} modelos Hot Wheels...\n")

    for i, url in enumerate(sample_urls, 1):
        print(f"[{i}/{total_urls}] Processando: {url}")
        
        car_data = scrape_hotwheels_model(url)
        
        if car_data and car_data.get('model'):
            if dry_run:
                print(f"[MODO TESTE] Simulando inserção de '{car_data.get('model')}'")
                successful_inserts += 1
            else:
                car_id = insert_car_to_supabase(car_data)
                if car_id:
                    successful_inserts += 1
        else:
            print(f"Falha ao extrair dados de: {url}")
        
        print("---")

    print(f"\nProcesso concluído!")
    print(f"Total de miniaturas {('simuladas' if dry_run else 'inseridas')}: {successful_inserts}/{total_urls}")

if __name__ == '__main__':
    import sys
    
    # Verificar se o script está sendo executado em modo de teste
    dry_run = '--dry-run' in sys.argv
    
    if dry_run:
        print("Executando em modo de teste (sem inserção no banco de dados)")
        scrape_and_populate_database(dry_run=True)
    else:
        # Example usage with the Datsun 240Z URL
        datsun_url = "https://hotwheels.fandom.com/wiki/Datsun_240Z"
        datsun_data = scrape_hotwheels_model(datsun_url)

        if datsun_data:
            print("Dados do Datsun 240Z:")
            for key, value in datsun_data.items():
                print(f"  {key}: {value}")

        # Sample URLs for scraping multiple models
        sample_urls = [
            "https://hotwheels.fandom.com/wiki/Datsun_240Z",
            "https://hotwheels.fandom.com/wiki/Custom_%2771_Datsun_240Z",
            "https://hotwheels.fandom.com/wiki/%2769_Chevelle_SS_396",
            "https://hotwheels.fandom.com/wiki/Bone_Shaker",
            "https://hotwheels.fandom.com/wiki/Porsche_911_Carrera_RS_2.7"
        ]

        all_cars_data = []
        for url in sample_urls:
            print(f"\nRaspando dados de: {url}")
            car_data = scrape_hotwheels_model(url)
            if car_data:
                all_cars_data.append(car_data)
                # Insert into Supabase
                car_id = insert_car_to_supabase(car_data)
                if car_id:
                    print(f"✓ Modelo '{car_data.get('model_name', 'Unknown')}' inserido com sucesso no Supabase")
                else:
                    print(f"✗ Falha ao inserir modelo '{car_data.get('model_name', 'Unknown')}' no Supabase")

        print("\n--- Dados Coletados ---")
        for car in all_cars_data:
            print(car)

        # Generate SQL INSERT statements for reference
        print("\n--- SQL INSERT Statements (Exemplo) ---")
        for car in all_cars_data:
            columns = []
            values = []
            for key, value in car.items():
                if value is not None:
                    columns.append(key)
                    if isinstance(value, str):
                        escaped_value = value.replace("'", "''")
                        values.append(f"'{escaped_value}'")  # Escape single quotes
                    else:
                        values.append(str(value))
            
            if columns and values:
                print(f"INSERT INTO miniatures_master ({', '.join(columns)}) VALUES ({', '.join(values)});")
        
        print("\nScraping concluído!")
