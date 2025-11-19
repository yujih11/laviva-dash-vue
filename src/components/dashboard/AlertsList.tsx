import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, XCircle } from "lucide-react";

interface AlertsListProps {
  alerts: string[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <Alert className="border-success/50 bg-success/5">
        <Info className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">Tudo em ordem</AlertTitle>
        <AlertDescription className="text-success-foreground">
          Não há alertas no momento.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const isWarning = alert.toLowerCase().includes("baixo") || alert.toLowerCase().includes("atenção");
        const isCritical = alert.toLowerCase().includes("crítico") || alert.toLowerCase().includes("urgente");

        return (
          <Alert
            key={index}
            className={
              isCritical
                ? "border-destructive/50 bg-destructive/5"
                : isWarning
                  ? "border-warning/50 bg-warning/5"
                  : "border-border"
            }
          >
            {isCritical ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
            <AlertTitle
              className={isCritical ? "text-destructive" : isWarning ? "text-warning" : "text-foreground"}
            >
              {isCritical ? "Crítico" : isWarning ? "Atenção" : "Informação"}
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">{alert}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
