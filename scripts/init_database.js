// Script para inicializar o banco de dados Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do arquivo .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Ler o arquivo SQL
const sqlFilePath = path.join(__dirname, 'create_tables.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function initDatabase() {
  console.log('Inicializando banco de dados Supabase...');
  
  try {
    // Executar o script SQL diretamente via REST API
    console.log('Criando tabelas via API REST...');
    
    // Criar tabela miniatures_master
    const { error: createMasterError } = await supabase
      .from('miniatures_master')
      .select()
      .limit(1);
    
    if (createMasterError && createMasterError.code === '42P01') { // Tabela não existe
      console.log('Criando tabela miniatures_master...');
      const { error } = await supabase.rest.post('/rest/v1/rpc/exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.miniatures_master (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            model_name TEXT NOT NULL,
            brand TEXT NOT NULL,
            launch_year INTEGER,
            series TEXT,
            collection_number TEXT,
            base_color TEXT,
            official_blister_photo_url TEXT,
            user_id UUID,
            visibility TEXT DEFAULT 'public',
            disponivel_para_negocio BOOLEAN DEFAULT FALSE,
            preco_negociacao DECIMAL(10, 2),
            contato_negociacao TEXT,
            observacoes_negociacao TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
          );
        `
      }).catch(err => ({ error: err }));
      
      if (error) {
        console.warn('Erro ao criar tabela miniatures_master:', error);
      } else {
        console.log('Tabela miniatures_master criada com sucesso!');
      }
    } else {
      console.log('Tabela miniatures_master já existe.');
    }
    
    // Criar tabela user_miniatures
    const { error: createUserError } = await supabase
      .from('user_miniatures')
      .select()
      .limit(1);
    
    if (createUserError && createUserError.code === '42P01') { // Tabela não existe
      console.log('Criando tabela user_miniatures...');
      const { error } = await supabase.rest.post('/rest/v1/rpc/exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_miniatures (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            miniature_id UUID,
            acquisition_date DATE,
            price_paid DECIMAL(10,2),
            condition TEXT CHECK (condition IN ('sealed', 'loose', 'damaged')),
            variants TEXT,
            is_treasure_hunt BOOLEAN DEFAULT false,
            is_super_treasure_hunt BOOLEAN DEFAULT false,
            personal_notes TEXT,
            user_photos_urls TEXT[],
            disponivel_para_negocio BOOLEAN DEFAULT FALSE,
            preco_negociacao DECIMAL(10, 2),
            contato_negociacao TEXT,
            observacoes_negociacao TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
          );
        `
      }).catch(err => ({ error: err }));
      
      if (error) {
        console.warn('Erro ao criar tabela user_miniatures:', error);
      } else {
        console.log('Tabela user_miniatures criada com sucesso!');
      }
    } else {
      console.log('Tabela user_miniatures já existe.');
    }
    
    // Verificar se as tabelas foram criadas
    console.log('Verificando tabelas criadas...');
    
    // Verificar tabela miniatures_master
    const { data: masterData, error: masterError } = await supabase
      .from('miniatures_master')
      .select('count(*)', { count: 'exact', head: true });
    
    if (masterError && masterError.code !== '42P01') {
      console.error('Erro ao verificar tabela miniatures_master:', masterError);
    } else if (!masterError) {
      console.log('Tabela miniatures_master está disponível!');
    }
    
    // Verificar tabela user_miniatures
    const { data: userMiniData, error: userMiniError } = await supabase
      .from('user_miniatures')
      .select('count(*)', { count: 'exact', head: true });
    
    if (userMiniError && userMiniError.code !== '42P01') {
      console.error('Erro ao verificar tabela user_miniatures:', userMiniError);
    } else if (!userMiniError) {
      console.log('Tabela user_miniatures está disponível!');
    }
    
    console.log('Inicialização do banco de dados concluída.');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
}

initDatabase();