// Tipos para as novas tabelas do Supabase

// Interface para a tabela 'cars' (nova estrutura)
export interface Car {
  id: string;
  nome: string;
  marca: string;
  ano?: number;
  serie?: string;
  cor_base?: string;
  numero_colecao?: string;
  codigo_base?: string;
  pais_fabricacao?: string;
  detalhes?: string;
  url_imagem?: string;
  numero_serie?: string;
  created_at: string;
  updated_at: string;
}

// Interface para a tabela 'características'
export interface Caracteristica {
  id: string;
  car_id: string;
  tipo: string; // ex: 'cor', 'material', 'acabamento'
  valor: string;
  created_at: string;
  updated_at: string;
}

// Interface para inserção de novos carros
export interface CarInsert {
  nome: string;
  marca: string;
  ano?: number;
  serie?: string;
  cor_base?: string;
  numero_colecao?: string;
  codigo_base?: string;
  pais_fabricacao?: string;
  detalhes?: string;
  url_imagem?: string;
  numero_serie?: string;
}

// Interface para atualização de carros
export interface CarUpdate {
  nome?: string;
  marca?: string;
  ano?: number;
  serie?: string;
  cor_base?: string;
  numero_colecao?: string;
  codigo_base?: string;
  pais_fabricacao?: string;
  detalhes?: string;
  url_imagem?: string;
  numero_serie?: string;
}

// Interface para busca/filtro de carros
export interface CarSearchParams {
  nome?: string;
  marca?: string;
  ano?: number;
  serie?: string;
  limit?: number;
  offset?: number;
}

// Interface para resultado de busca
export interface CarSearchResult {
  data: Car[];
  total: number;
  hasMore: boolean;
}

// Interface para compatibilidade com estrutura atual
export interface MiniatureWithCar {
  id: string;
  acquisition_date: string;
  condition: string;
  is_treasure_hunt: boolean;
  is_super_treasure_hunt: boolean;
  price_paid: number;
  variants: string;
  personal_notes: string;
  user_photos_urls: string[];
  car: Car; // Nova referência
  // Manter compatibilidade com estrutura antiga
  miniatures_master?: MiniaturesMaster;
};

// Interface para a tabela miniatures_master
export interface MiniaturesMaster {
  id: string;
  model_name: string;
  brand: string;
  launch_year: number;
  series: string;
  collection_number: string;
  base_color: string;
  official_blister_photo_url: string;
  upc?: string;
};

// Função utilitária para converter Car para MiniaturesMaster (compatibilidade)
export function carToMiniaturesMaster(car: Car) {
  return {
    id: car.id,
    model_name: car.nome,
    brand: car.marca,
    launch_year: car.ano || 0,
    series: car.serie || '',
    collection_number: car.numero_colecao || '',
    base_color: car.cor_base || '',
    official_blister_photo_url: car.url_imagem || ''
  };
}

// Função utilitária para converter MiniaturesMaster para Car
export function miniaturesMasterToCar(miniature: MiniaturesMaster): CarInsert {
  return {
    nome: miniature.model_name,
    marca: miniature.brand,
    ano: miniature.launch_year,
    serie: miniature.series,
    cor_base: miniature.base_color,
    numero_colecao: miniature.collection_number,
    url_imagem: miniature.official_blister_photo_url
  };
}
