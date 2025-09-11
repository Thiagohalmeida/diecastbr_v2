#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para testar a conexão com o Supabase
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
import requests

# Carregar variáveis de ambiente
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def test_basic_connection():
    """Testa a conectividade básica com o servidor Supabase"""
    print("=== TESTE DE CONECTIVIDADE BÁSICA ===")
    print(f"SUPABASE_URL: {SUPABASE_URL}")
    print(f"SUPABASE_KEY definida: {bool(SUPABASE_KEY)}")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Erro: Variáveis de ambiente não encontradas")
        return False
    
    try:
        # Teste básico de conectividade HTTP
        print("\nTestando conectividade HTTP...")
        response = requests.get(SUPABASE_URL, timeout=10)
        print(f"✅ Conectividade HTTP OK - Status: {response.status_code}")
        return True
    except requests.exceptions.ConnectTimeout:
        print("❌ Timeout na conexão")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Erro de conexão: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_supabase_client():
    """Testa a criação do cliente Supabase"""
    print("\n=== TESTE DO CLIENTE SUPABASE ===")
    
    try:
        # Criar cliente Supabase
        print("Criando cliente Supabase...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Cliente Supabase criado com sucesso")
        return supabase
    except Exception as e:
        print(f"❌ Erro ao criar cliente Supabase: {e}")
        return None

def test_database_query(supabase):
    """Testa uma consulta simples no banco de dados"""
    print("\n=== TESTE DE CONSULTA NO BANCO ===")
    
    if not supabase:
        print("❌ Cliente Supabase não disponível")
        return False
    
    try:
        # Teste de consulta simples
        print("Executando consulta de teste...")
        result = supabase.table('miniatures_master').select('id').limit(1).execute()
        print(f"✅ Consulta executada com sucesso")
        print(f"Resultado: {result}")
        return True
    except Exception as e:
        print(f"❌ Erro na consulta: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def test_table_structure(supabase):
    """Testa se a tabela miniatures_master existe e sua estrutura"""
    print("\n=== TESTE DA ESTRUTURA DA TABELA ===")
    
    if not supabase:
        print("❌ Cliente Supabase não disponível")
        return False
    
    try:
        # Tentar obter informações da tabela
        print("Verificando estrutura da tabela miniatures_master...")
        result = supabase.table('miniatures_master').select('*').limit(0).execute()
        print("✅ Tabela miniatures_master existe e é acessível")
        return True
    except Exception as e:
        print(f"❌ Erro ao acessar tabela: {e}")
        return False

def main():
    """Função principal para executar todos os testes"""
    print("🔍 INICIANDO TESTES DE CONEXÃO COM SUPABASE\n")
    
    # Teste 1: Conectividade básica
    if not test_basic_connection():
        print("\n❌ FALHA: Problema de conectividade básica")
        return
    
    # Teste 2: Cliente Supabase
    supabase = test_supabase_client()
    if not supabase:
        print("\n❌ FALHA: Não foi possível criar cliente Supabase")
        return
    
    # Teste 3: Consulta no banco
    if not test_database_query(supabase):
        print("\n❌ FALHA: Problema na consulta ao banco de dados")
        return
    
    # Teste 4: Estrutura da tabela
    if not test_table_structure(supabase):
        print("\n❌ FALHA: Problema com a estrutura da tabela")
        return
    
    print("\n✅ SUCESSO: Todos os testes passaram!")
    print("A conexão com o Supabase está funcionando corretamente.")

if __name__ == '__main__':
    main()
