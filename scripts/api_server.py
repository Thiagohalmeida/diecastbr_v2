from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import secrets
import uvicorn

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Usando a chave de serviço

# Verificar se as variáveis de ambiente estão definidas
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Variáveis de ambiente do Supabase não encontradas")

# Configuração de autenticação básica para a API
API_USERNAME = os.getenv('API_USERNAME', 'admin')
API_PASSWORD = os.getenv('API_PASSWORD', 'password')

# Criar cliente Supabase com a chave de serviço
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Inicializar FastAPI
app = FastAPI(title="Diecast BR Garage API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar autenticação básica
security = HTTPBasic()

# Modelo para miniatura
class Miniature(BaseModel):
    model_name: str
    brand: str
    launch_year: Optional[int] = None
    series: Optional[str] = None
    disponivel_para_negocio: Optional[bool] = False
    preco_negociacao: Optional[float] = None
    contato_negociacao: Optional[str] = None
    observacoes_negociacao: Optional[str] = None
    collection_number: Optional[str] = None
    base_color: Optional[str] = None
    tampo_color: Optional[str] = None
    wheel_type: Optional[str] = None
    visibility: Optional[str] = Field(None, description="public, private ou null")

# Modelo para resposta de inserção
class InsertResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

# Função para verificar credenciais
def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, API_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, API_PASSWORD)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Rota para verificar status da API
@app.get("/", tags=["Status"])
async def read_root():
    return {"status": "online", "message": "Diecast BR Garage API"}

# Rota para inserir uma miniatura
@app.post("/miniatures", response_model=InsertResponse, tags=["Miniatures"])
async def create_miniature(miniature: Miniature, username: str = Depends(verify_credentials)):
    try:
        # Converter o modelo Pydantic para dicionário e remover valores None
        insert_data = {k: v for k, v in miniature.dict().items() if v is not None}
        
        # Verificar se a miniatura já existe
        model_name = insert_data['model_name']
        launch_year = insert_data.get('launch_year')
        series = insert_data.get('series', '')
        
        query = supabase.table('miniatures_master').select('id').eq('model_name', model_name)
        if launch_year:
            query = query.eq('launch_year', launch_year)
        if series:
            query = query.eq('series', series)
            
        existing = query.execute()
        
        if existing.data:
            return InsertResponse(
                success=False,
                message=f"Miniatura '{model_name}' já existe no banco de dados"
            )
        
        # Inserir nova miniatura usando a chave de serviço (ignora RLS)
        result = supabase.table('miniatures_master').insert(insert_data).execute()
        
        if result.data:
            return InsertResponse(
                success=True,
                message=f"Miniatura '{model_name}' inserida com sucesso",
                data=result.data[0]
            )
        else:
            return InsertResponse(
                success=False,
                message=f"Erro ao inserir miniatura: Sem dados retornados"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar miniatura: {str(e)}"
        )

# Rota para inserir múltiplas miniaturas
@app.post("/miniatures/batch", response_model=Dict[str, Any], tags=["Miniatures"])
async def create_miniatures_batch(miniatures: List[Miniature], username: str = Depends(verify_credentials)):
    results = {
        "total": len(miniatures),
        "successful": 0,
        "failed": 0,
        "details": []
    }
    
    for miniature in miniatures:
        try:
            # Converter o modelo Pydantic para dicionário e remover valores None
            insert_data = {k: v for k, v in miniature.dict().items() if v is not None}
            
            # Verificar se a miniatura já existe
            model_name = insert_data['model_name']
            launch_year = insert_data.get('launch_year')
            series = insert_data.get('series', '')
            
            query = supabase.table('miniatures_master').select('id').eq('model_name', model_name)
            if launch_year:
                query = query.eq('launch_year', launch_year)
            if series:
                query = query.eq('series', series)
                
            existing = query.execute()
            
            if existing.data:
                results["failed"] += 1
                results["details"].append({
                    "model_name": model_name,
                    "success": False,
                    "message": "Já existe no banco de dados"
                })
                continue
            
            # Inserir nova miniatura
            result = supabase.table('miniatures_master').insert(insert_data).execute()
            
            if result.data:
                results["successful"] += 1
                results["details"].append({
                    "model_name": model_name,
                    "success": True,
                    "message": "Inserida com sucesso",
                    "id": result.data[0]["id"]
                })
            else:
                results["failed"] += 1
                results["details"].append({
                    "model_name": model_name,
                    "success": False,
                    "message": "Erro ao inserir: Sem dados retornados"
                })
        except Exception as e:
            results["failed"] += 1
            results["details"].append({
                "model_name": miniature.model_name,
                "success": False,
                "message": f"Erro: {str(e)}"
            })
    
    return results

# Iniciar servidor se executado diretamente
if __name__ == "__main__":
    # Verificar se as credenciais padrão estão sendo usadas
    if API_USERNAME == "admin" and API_PASSWORD == "password":
        print("AVISO: Usando credenciais padrão. Recomendado definir API_USERNAME e API_PASSWORD no arquivo .env")
    
    # Iniciar servidor
    print(f"Iniciando API Diecast BR Garage...")
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
