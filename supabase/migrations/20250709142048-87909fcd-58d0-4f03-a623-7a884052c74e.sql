-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table for user additional data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  total_miniatures INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create master miniatures database
CREATE TABLE public.miniatures_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  launch_year INTEGER,
  series TEXT,
  collection_number TEXT,
  base_color TEXT,
  official_blister_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(model_name, brand, launch_year, series)
);

-- Enable RLS on miniatures_master
ALTER TABLE public.miniatures_master ENABLE ROW LEVEL SECURITY;

-- Create policies for miniatures_master
CREATE POLICY "Master miniatures are viewable by everyone" 
ON public.miniatures_master 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert master miniatures" 
ON public.miniatures_master 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create user miniatures collection
CREATE TABLE public.user_miniatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  miniature_id UUID REFERENCES public.miniatures_master(id),
  -- User specific data
  acquisition_date DATE,
  price_paid DECIMAL(10,2),
  condition TEXT CHECK (condition IN ('sealed', 'loose', 'damaged')),
  variants TEXT,
  is_treasure_hunt BOOLEAN DEFAULT false,
  is_super_treasure_hunt BOOLEAN DEFAULT false,
  personal_notes TEXT,
  user_photos_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_miniatures
ALTER TABLE public.user_miniatures ENABLE ROW LEVEL SECURITY;

-- Create policies for user_miniatures
CREATE POLICY "Users can view their own miniatures" 
ON public.user_miniatures 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own miniatures" 
ON public.user_miniatures 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own miniatures" 
ON public.user_miniatures 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own miniatures" 
ON public.user_miniatures 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('miniature-photos', 'miniature-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('blister-photos', 'blister-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);

-- Create storage policies for miniature photos
CREATE POLICY "Users can view all miniature photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'miniature-photos');

CREATE POLICY "Users can upload their own miniature photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'miniature-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own miniature photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'miniature-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own miniature photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'miniature-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for blister photos
CREATE POLICY "Users can view all blister photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blister-photos');

CREATE POLICY "Users can upload their own blister photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'blister-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for generated images
CREATE POLICY "Users can view all generated images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Users can upload their own generated images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_miniatures_master_updated_at
BEFORE UPDATE ON public.miniatures_master
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_miniatures_updated_at
BEFORE UPDATE ON public.user_miniatures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update total miniatures count
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

-- Create triggers to update miniatures count
CREATE TRIGGER update_miniatures_count_insert
  AFTER INSERT ON public.user_miniatures
  FOR EACH ROW EXECUTE FUNCTION public.update_total_miniatures();

CREATE TRIGGER update_miniatures_count_delete
  AFTER DELETE ON public.user_miniatures
  FOR EACH ROW EXECUTE FUNCTION public.update_total_miniatures();
