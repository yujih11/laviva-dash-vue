import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditarCrescimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  produtoNome: string;
  crescimentoAtual: number | null;
  onSuccess: () => void;
}

export function EditarCrescimentoDialog({
  open,
  onOpenChange,
  codigoProduto,
  produtoNome,
  crescimentoAtual,
  onSuccess,
}: EditarCrescimentoDialogProps) {
  const [percentual, setPercentual] = useState<string>(
    crescimentoAtual?.toString() || "10"
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const valor = parseFloat(percentual);
    
    if (isNaN(valor)) {
      toast.error("Valor inválido", {
        description: "Por favor, insira um número válido.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("crescimento_produtos")
        .upsert({
          codigo_produto: codigoProduto,
          percentual_crescimento: valor,
        }, {
          onConflict: "codigo_produto"
        });

      if (error) throw error;

      toast.success("Crescimento atualizado", {
        description: `O percentual de crescimento foi definido para ${valor}%.`,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar crescimento:", error);
      toast.error("Erro ao salvar", {
        description: "Não foi possível atualizar o percentual de crescimento.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Percentual de Crescimento</DialogTitle>
          <DialogDescription>
            Defina o percentual de crescimento para este produto. Este valor será usado no cálculo das previsões.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Produto</Label>
            <p className="text-sm text-muted-foreground">{produtoNome}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Código</Label>
            <p className="text-sm text-muted-foreground font-mono">{codigoProduto}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="percentual">Percentual de Crescimento (%)</Label>
            <Input
              id="percentual"
              type="number"
              step="0.1"
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground">
              Valor atual: {crescimentoAtual || 10}%
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
