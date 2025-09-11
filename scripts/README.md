# Scripts de Banco de Dados Supabase

Este diretório contém scripts para inicializar e gerenciar o banco de dados Supabase do projeto.

## Erro "Could not find the table 'public.user_miniatures'"

Se você estiver vendo o erro "Could not find the table 'public.user_miniatures' in the schema cache", isso significa que as tabelas necessárias não foram criadas no banco de dados Supabase.

## Inicialização do Banco de Dados

Para inicializar o banco de dados com as tabelas necessárias, siga os passos abaixo:

### 1. Instalar dependências

```bash
npm install dotenv @supabase/supabase-js
```

### 2. Executar o script de inicialização

```bash
node scripts/init_database.js
```

Este script irá:

1. Conectar ao seu banco de dados Supabase usando as credenciais do arquivo `.env.local`
2. Executar o script SQL `create_tables.sql` para criar as tabelas necessárias
3. Verificar se as tabelas foram criadas com sucesso

## Estrutura do Banco de Dados

O banco de dados contém as seguintes tabelas principais:

- `profiles`: Perfis de usuários com informações adicionais
- `miniatures_master`: Catálogo mestre de miniaturas disponíveis
- `user_miniatures`: Coleção de miniaturas de cada usuário

## Solução de Problemas

Se você continuar enfrentando problemas após executar o script de inicialização:

1. Verifique se as credenciais do Supabase no arquivo `.env.local` estão corretas
2. Verifique se o usuário tem permissões para criar tabelas no banco de dados
3. Tente executar os comandos SQL diretamente no SQL Editor do Supabase

## Migrações Manuais

Se preferir, você pode executar as migrações manualmente no SQL Editor do Supabase:

1. Acesse o painel de administração do Supabase
2. Vá para a seção "SQL Editor"
3. Copie e cole o conteúdo do arquivo `create_tables.sql`
4. Execute o script