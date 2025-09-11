import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface DatabaseErrorProps {
  title?: string
  description?: string
  errorMessage?: string
  onRetry?: () => void
}

export function DatabaseError({
  title = "Erro ao carregar dados",
  description = "Não foi possível conectar ao banco de dados ou a tabela necessária não existe.",
  errorMessage,
  onRetry
}: DatabaseErrorProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Detalhes do erro:</AlertTitle>
            <AlertDescription className="font-mono text-xs break-all">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground">
          Este erro pode ocorrer se o banco de dados não foi inicializado corretamente ou se as migrações não foram aplicadas.
          Entre em contato com o administrador do sistema para resolver este problema.
        </p>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button onClick={onRetry} variant="outline" className="w-full">
            Tentar novamente
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}