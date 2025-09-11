-- Script SQL para atualizar as políticas RLS no Supabase
-- Este script deve ser executado no SQL Editor do Supabase

-- Habilitar RLS na tabela miniatures_master (caso ainda não esteja habilitado)
ALTER TABLE miniatures_master ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Miniatures são visíveis para todos" ON miniatures_master;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir miniaturas" ON miniatures_master;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias miniaturas" ON miniatures_master;
DROP POLICY IF EXISTS "Usuários podem excluir suas próprias miniaturas" ON miniatures_master;

-- Política para visualização: miniaturas públicas são visíveis para todos, privadas apenas para o proprietário
CREATE POLICY "Miniatures são visíveis para todos" 
ON miniatures_master 
FOR SELECT 
USING (
  visibility = 'public' OR 
  (auth.uid() = user_id) OR
  (visibility IS NULL) -- Considerar NULL como público
);

-- Política para inserção: usuários autenticados podem inserir miniaturas
CREATE POLICY "Usuários autenticados podem inserir miniaturas" 
ON miniatures_master 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização: usuários podem atualizar suas próprias miniaturas
CREATE POLICY "Usuários podem atualizar suas próprias miniaturas" 
ON miniatures_master 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para exclusão: usuários podem excluir suas próprias miniaturas
CREATE POLICY "Usuários podem excluir suas próprias miniaturas" 
ON miniatures_master 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar coluna user_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'miniatures_master' AND column_name = 'user_id') THEN
    ALTER TABLE miniatures_master ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    -- Definir um trigger para preencher automaticamente o user_id com o usuário atual
    CREATE OR REPLACE FUNCTION set_user_id()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.user_id = auth.uid();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE TRIGGER set_miniatures_user_id
    BEFORE INSERT ON miniatures_master
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();
  END IF;
  
  -- Adicionar coluna visibility se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'miniatures_master' AND column_name = 'visibility') THEN
    ALTER TABLE miniatures_master ADD COLUMN visibility TEXT DEFAULT 'public';
  END IF;
END $$;

-- Comentários sobre as colunas
COMMENT ON COLUMN miniatures_master.user_id IS 'ID do usuário que criou a miniatura';
COMMENT ON COLUMN miniatures_master.visibility IS 'Visibilidade da miniatura: public, private ou null (considerado como public)';
