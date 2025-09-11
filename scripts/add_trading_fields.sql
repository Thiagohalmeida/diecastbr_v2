-- Script SQL para adicionar campos relacionados à negociação de miniaturas
-- Este script deve ser executado no SQL Editor do Supabase

-- Adicionar coluna disponivel_para_negocio se não existir
DO $$ 
BEGIN
  -- Adicionar coluna para marcar se a miniatura está disponível para negociação
  IF NOT EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'miniatures_master' AND column_name = 'disponivel_para_negocio') THEN
    ALTER TABLE miniatures_master ADD COLUMN disponivel_para_negocio BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN miniatures_master.disponivel_para_negocio IS 'Indica se a miniatura está disponível para negociação';
  END IF;
  
  -- Adicionar coluna para o preço pedido
  IF NOT EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'miniatures_master' AND column_name = 'preco_negociacao') THEN
    ALTER TABLE miniatures_master ADD COLUMN preco_negociacao DECIMAL(10, 2);
    COMMENT ON COLUMN miniatures_master.preco_negociacao IS 'Preço pedido pelo vendedor para negociação';
  END IF;
  
  -- Adicionar coluna para informações de contato
  IF NOT EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'miniatures_master' AND column_name = 'contato_negociacao') THEN
    ALTER TABLE miniatures_master ADD COLUMN contato_negociacao TEXT;
    COMMENT ON COLUMN miniatures_master.contato_negociacao IS 'Informações de contato para negociação (email, whatsapp, etc)';
  END IF;
  
  -- Adicionar coluna para observações sobre a negociação
  IF NOT EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'miniatures_master' AND column_name = 'observacoes_negociacao') THEN
    ALTER TABLE miniatures_master ADD COLUMN observacoes_negociacao TEXT;
    COMMENT ON COLUMN miniatures_master.observacoes_negociacao IS 'Observações adicionais sobre a negociação';
  END IF;
  
  -- Garantir que as colunas user_id e visibility existam (caso o script update_rls_policies.sql não tenha sido executado)
  IF NOT EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'miniatures_master' AND column_name = 'user_id') THEN
    ALTER TABLE miniatures_master ADD COLUMN user_id UUID REFERENCES auth.users(id);
    COMMENT ON COLUMN miniatures_master.user_id IS 'ID do usuário que criou a miniatura';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'miniatures_master' AND column_name = 'visibility') THEN
    ALTER TABLE miniatures_master ADD COLUMN visibility TEXT DEFAULT 'public';
    COMMENT ON COLUMN miniatures_master.visibility IS 'Visibilidade da miniatura: public, private ou null (considerado como public)';
  END IF;
END $$;

-- Atualizar as políticas RLS para incluir a visualização de miniaturas para negociação
-- Política para visualização: miniaturas públicas são visíveis para todos, privadas apenas para o proprietário
DROP POLICY IF EXISTS "Miniatures são visíveis para todos" ON miniatures_master;
CREATE POLICY "Miniatures são visíveis para todos" 
ON miniatures_master 
FOR SELECT 
USING (
  visibility = 'public' OR 
  (auth.uid() = user_id) OR
  (visibility IS NULL) -- Considerar NULL como público
);

-- Adicionar índice para melhorar a performance de consultas de miniaturas para negociação
CREATE INDEX IF NOT EXISTS idx_miniatures_negociacao ON miniatures_master (disponivel_para_negocio) WHERE disponivel_para_negocio = TRUE;
