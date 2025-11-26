import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MiniGraficoComparacaoProps {
  previsao: number;
  realizado: number | null;
  className?: string;
}

export function MiniGraficoComparacao({ previsao, realizado, className }: MiniGraficoComparacaoProps) {
  const { variacao, color, Icon } = useMemo(() => {
    if (!realizado || previsao === 0) {
      return { variacao: 0, color: "text-muted-foreground", Icon: Minus };
    }

    const diff = ((realizado - previsao) / previsao) * 100;
    
    if (diff > 0) {
      return { 
        variacao: diff, 
        color: "text-success", 
        Icon: TrendingUp 
      };
    } else if (diff < 0) {
      return { 
        variacao: diff, 
        color: "text-destructive", 
        Icon: TrendingDown 
      };
    }
    
    return { variacao: 0, color: "text-muted-foreground", Icon: Minus };
  }, [previsao, realizado]);

  if (!realizado) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const barWidth = Math.min(Math.abs(variacao), 100);
  const isPositive = variacao > 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Mini barra */}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[60px]">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isPositive ? "bg-success" : "bg-destructive"
          )}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      
      {/* Ícone e valor */}
      <div className={cn("flex items-center gap-0.5 text-xs font-medium", color)}>
        <Icon className="h-3 w-3" />
        <span>{Math.abs(variacao).toFixed(0)}%</span>
      </div>
    </div>
  );
}
