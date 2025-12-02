import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, XCircle, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { DashboardData } from "@/hooks/useSupabaseDashboardData";
import { calcularAlertas } from "@/lib/alertas-utils";
import { cleanProductName } from "@/lib/product-utils";
import { cn } from "@/lib/utils";

interface AlertasAgrupadosProps {
  data: DashboardData[];
  mesSelecionado?: number | null;
  anoSelecionado?: string | null;
}

interface AlertaItem {
  codigo: string;
  produto: string;
  alertas: string[];
}

interface AlertaGrupo {
  tipo: string;
  severidade: "critico" | "moderado" | "info";
  icon: typeof AlertTriangle;
  items: AlertaItem[];
}

export function AlertasAgrupados({ data, mesSelecionado, anoSelecionado }: AlertasAgrupadosProps) {
  const [alertasMap, setAlertasMap] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);

  // Calcular alertas quando os dados mudarem
  useEffect(() => {
    const calcular = async () => {
      setLoading(true);
      const alertas = await calcularAlertas(
        data,
        mesSelecionado || null,
        anoSelecionado ? parseInt(anoSelecionado) : null
      );
      setAlertasMap(alertas);
      setLoading(false);
    };
    calcular();
  }, [data, mesSelecionado, anoSelecionado]);

  // Agrupar alertas por tipo
  const alertasAgrupados: AlertaGrupo[] = [];

  // Agrupar por tipo de alerta
  const produtosParados: AlertaItem[] = [];
  const variacoesDivergentes: AlertaItem[] = [];

  alertasMap.forEach((alertas, codigoProduto) => {
    const produto = data.find(d => d.codigo_produto === codigoProduto);
    const produtoNome = produto ? cleanProductName(produto.produto) : codigoProduto;

    alertas.forEach(alerta => {
      const item: AlertaItem = {
        codigo: codigoProduto,
        produto: produtoNome,
        alertas: [alerta],
      };

      if (alerta.toLowerCase().includes("parado") || alerta.toLowerCase().includes("sem venda")) {
        const existing = produtosParados.find(p => p.codigo === codigoProduto);
        if (existing) {
          existing.alertas.push(alerta);
        } else {
          produtosParados.push(item);
        }
      } else if (alerta.toLowerCase().includes("variação") || alerta.toLowerCase().includes("divergente")) {
        const existing = variacoesDivergentes.find(p => p.codigo === codigoProduto);
        if (existing) {
          existing.alertas.push(alerta);
        } else {
          variacoesDivergentes.push(item);
        }
      }
    });
  });

  if (produtosParados.length > 0) {
    alertasAgrupados.push({
      tipo: "Produtos Parados",
      severidade: "moderado",
      icon: Clock,
      items: produtosParados,
    });
  }

  if (variacoesDivergentes.length > 0) {
    alertasAgrupados.push({
      tipo: "Variações Divergentes",
      severidade: "critico",
      icon: TrendingDown,
      items: variacoesDivergentes,
    });
  }

  const totalAlertas = alertasMap.size;

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se não houver alertas, mostrar card verde
  if (totalAlertas === 0) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-success">Tudo em ordem</h3>
              <p className="text-sm text-success-foreground">Não há alertas no momento.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeveridadeStyles = (severidade: AlertaGrupo["severidade"]) => {
    switch (severidade) {
      case "critico":
        return {
          badge: "bg-destructive text-destructive-foreground",
          alert: "border-destructive/50 bg-destructive/5",
          iconColor: "text-destructive",
        };
      case "moderado":
        return {
          badge: "bg-warning text-warning-foreground",
          alert: "border-warning/50 bg-warning/5",
          iconColor: "text-warning",
        };
      case "info":
        return {
          badge: "bg-primary text-primary-foreground",
          alert: "border-primary/50 bg-primary/5",
          iconColor: "text-primary",
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle>Alertas e Notificações</CardTitle>
          </div>
          <Badge variant="destructive" className="text-sm">
            {totalAlertas} {totalAlertas === 1 ? "produto" : "produtos"} com alertas
          </Badge>
        </div>
        <CardDescription>Itens que requerem atenção imediata</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertasAgrupados.map((grupo) => {
          const styles = getSeveridadeStyles(grupo.severidade);
          const Icon = grupo.icon;

          return (
            <Alert key={grupo.tipo} className={styles.alert}>
              <Icon className={cn("h-4 w-4", styles.iconColor)} />
              <AlertTitle className="flex items-center gap-2 mb-3">
                {grupo.tipo}
                <Badge className={styles.badge} variant="secondary">
                  {grupo.items.length}
                </Badge>
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-3">
                  {grupo.items.map((item) => (
                    <div
                      key={item.codigo}
                      className="p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {item.produto}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Código: {item.codigo}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/30">
                        {item.alertas.map((alerta, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                            {alerta}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
