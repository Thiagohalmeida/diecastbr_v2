-- Script para criar as tabelas necessárias no Supabase

-- Criar a tabela de perfis de usuários se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  total_miniatures INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas para profiles
CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar a tabela de miniaturas master se não existir
CREATE TABLE IF NOT EXISTS public.miniatures_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  launch_year INTEGER,
  series TEXT,
  collection_number TEXT,
  base_color TEXT,
  official_blister_photo_url TEXT,
  user_id UUID REFERENCES auth.users(id),
  visibility TEXT DEFAULT 'public',
  disponivel_para_negocio BOOLEAN DEFAULT FALSE,
  preco_negociacao DECIMAL(10, 2),
  contato_negociacao TEXT,
  observacoes_negociacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(model_name, brand, launch_year, series)
);

-- Habilitar RLS na tabela miniatures_master
ALTER TABLE public.miniatures_master ENABLE ROW LEVEL SECURITY;

-- Criar políticas para miniatures_master
CREATE POLICY IF NOT EXISTS "Master miniatures are viewable by everyone" 
ON public.miniatures_master 
FOR SELECT 
USING (
  visibility = 'public' OR 
  (auth.uid() = user_id) OR
  (visibility IS NULL)
);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert master miniatures" 
ON public.miniatures_master 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Criar a tabela de miniaturas do usuário se não existir
CREATE TABLE IF NOT EXISTS public.user_miniatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  miniature_id UUID REFERENCES public.miniatures_master(id),
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

-- Habilitar RLS na tabela user_miniatures
ALTER TABLE public.user_miniatures ENABLE ROW LEVEL SECURITY;

-- Criar políticas para user_miniatures
CREATE POLICY IF NOT EXISTS "Users can view their own miniatures" 
ON public.user_miniatures 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own miniatures" 
ON public.user_miniatures 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own miniatures" 
ON public.user_miniatures 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own miniatures" 
ON public.user_miniatures 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar função para atualizar o contador de miniaturas
CREATE OR REPLACE FUNCTION public.update_total_miniatures()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET total_miniatures = total_miniatures + 1 
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET total_miniatures = total_miniatures - 1 
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Criar triggers para atualizar o contador de miniaturas
DROP TRIGGER IF EXISTS update_miniatures_count_insert ON public.user_miniatures;
CREATE TRIGGER update_miniatures_count_insert
  AFTER INSERT ON public.user_miniatures
  FOR EACH ROW EXECUTE FUNCTION public.update_total_miniatures();

DROP TRIGGER IF EXISTS update_miniatures_count_delete ON public.user_miniatures;
CREATE TRIGGER update_miniatures_count_delete
  AFTER DELETE ON public.user_miniatures
  FOR EACH ROW EXECUTE FUNCTION public.update_total_miniatures();