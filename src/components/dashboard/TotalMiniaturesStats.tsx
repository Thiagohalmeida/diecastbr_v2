import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TotalMiniaturesStatsProps {
  className?: string;
}

export function TotalMiniaturesStats({ className }: TotalMiniaturesStatsProps) {
  const [totalMiniatures, setTotalMiniatures] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTotalMiniatures = async () => {
      try {
        // Consulta para obter o total de miniaturas no sistema
        const { count, error } = await supabase
          .from('miniatures_master')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Erro ao buscar total de miniaturas:', error);
          return;
        }

        setTotalMiniatures(count || 0);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalMiniatures();
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Total de Miniaturas no Sistema
        </CardTitle>
        <Database className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "Carregando..." : totalMiniatures}
        </div>
        <p className="text-xs text-muted-foreground">
          Miniaturas cadastradas no banco de dados
        </p>
      </CardContent>
    </Card>
  );
}
