import React from 'react'
import { AlertCircle, Database, Terminal } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface GarageErrorProps {
  errorMessage?: string
  onRetry?: () => void
}

export function GarageError({ errorMessage, onRetry }: GarageErrorProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-destructive" />
          <CardTitle>Erro ao carregar sua coleção</CardTitle>
        </div>
        <CardDescription>
          Não foi possível encontrar a tabela de miniaturas no banco de dados Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Detalhes do erro:</AlertTitle>
            <AlertDescription className="font-mono text-xs break-all">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="solution">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="solution">Solução</TabsTrigger>
            <TabsTrigger value="technical">Detalhes Técnicos</TabsTrigger>
          </TabsList>
          <TabsContent value="solution" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="font-medium">Como resolver:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Execute o script de inicialização do banco de dados para criar as tabelas necessárias</li>
                <li>Verifique se as credenciais do Supabase estão corretas no arquivo <code>.env.local</code></li>
                <li>Reinicie o servidor de desenvolvimento após a inicialização do banco de dados</li>
              </ol>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4" />
                <p className="font-medium">Execute no terminal:</p>
              </div>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                npm install dotenv @supabase/supabase-js<br />
                node scripts/init_database.js
              </pre>
            </div>
          </TabsContent>
          <TabsContent value="technical" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Este erro ocorre porque a tabela <code>public.user_miniatures</code> não existe no banco de dados Supabase.
              Esta tabela é necessária para armazenar as miniaturas da sua coleção.
            </p>
            <p className="text-sm text-muted-foreground">
              O script de inicialização criará as seguintes tabelas:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li><code>profiles</code> - Perfis de usuários</li>
              <li><code>miniatures_master</code> - Catálogo mestre de miniaturas</li>
              <li><code>user_miniatures</code> - Coleção de miniaturas dos usuários</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Consulte o arquivo <code>scripts/README.md</code> para mais informações sobre a estrutura do banco de dados.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button onClick={onRetry} className="w-full">
            Tentar novamente
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}