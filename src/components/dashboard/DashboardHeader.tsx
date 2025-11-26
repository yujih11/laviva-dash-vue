import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import lavivaLogo from "@/assets/laviva-logo.png";

interface DashboardHeaderProps {
  onRefresh: () => void;
  loading?: boolean;
}

export function DashboardHeader({ onRefresh, loading }: DashboardHeaderProps) {
  const { signOut, user } = useAuth();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo e Títulos */}
          <div className="flex items-center gap-4">
            <img
              src={lavivaLogo}
              alt="LAVIVA Logo"
              className="h-12 w-auto object-contain"
            />
            <div className="border-l border-border pl-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Dashboard de Previsão de Produção
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Controle e análise preditiva
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            {user && (
              <Button
                onClick={signOut}
                variant="ghost"
                size="sm"
                className="gap-2 shrink-0"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
