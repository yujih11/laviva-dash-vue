import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { DashboardData } from "@/hooks/useSupabaseDashboardData";
import { agruparAlertas, AlertaAgrupado } from "@/lib/alert-utils";
import { cn } from "@/lib/utils";

interface AlertasAgrupadosProps {
  data: DashboardData[];
}

export function AlertasAgrupados({ data }: AlertasAgrupadosProps) {
  const alertasAgrupados = agruparAlertas(data);
  const totalAlertas = alertasAgrupados.reduce((acc, grupo) => acc + grupo.produtos.length, 0);

  // Se não houver alertas, mostrar card verde
  if (alertasAgrupados.length === 0 || totalAlertas === 0) {
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

  const getSeveridadeStyles = (severidade: AlertaAgrupado["severidade"]) => {
    switch (severidade) {
      case "critico":
        return {
          badge: "bg-destructive text-destructive-foreground",
          alert: "border-destructive/50 bg-destructive/5",
          icon: XCircle,
          iconColor: "text-destructive",
        };
      case "moderado":
        return {
          badge: "bg-warning text-warning-foreground",
          alert: "border-warning/50 bg-warning/5",
          icon: AlertTriangle,
          iconColor: "text-warning",
        };
      case "info":
        return {
          badge: "bg-primary text-primary-foreground",
          alert: "border-primary/50 bg-primary/5",
          icon: Info,
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
          <Badge variant="secondary" className="text-sm">
            {totalAlertas} {totalAlertas === 1 ? "item" : "itens"}
          </Badge>
        </div>
        <CardDescription>Itens que requerem atenção imediata</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertasAgrupados.map((grupo) => {
          const styles = getSeveridadeStyles(grupo.severidade);
          const Icon = styles.icon;

          return (
            <Alert key={grupo.tipo} className={styles.alert}>
              <Icon className={cn("h-4 w-4", styles.iconColor)} />
              <AlertTitle className="flex items-center gap-2 mb-3">
                {grupo.tipo}
                <Badge className={styles.badge} variant="secondary">
                  {grupo.produtos.length}
                </Badge>
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  {grupo.produtos.map((produto) => (
                    <TooltipProvider key={produto.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-start gap-2 p-2 rounded hover:bg-muted/30 transition-colors cursor-help">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {produto.produto}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {produto.cliente} • {produto.codigo}
                              </p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover max-w-[350px]">
                          <div className="space-y-2">
                            <p className="font-semibold text-foreground">{produto.produto}</p>
                            <p className="text-xs text-muted-foreground">
                              Cliente: {produto.cliente}
                            </p>
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs font-medium mb-1">Detalhes dos alertas:</p>
                              {produto.alertas.map((alerta, idx) => (
                                <p key={idx} className="text-xs text-muted-foreground">
                                  • {alerta}
                                </p>
                              ))}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
