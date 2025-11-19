import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { getViewingContext } from "@/lib/date-utils";

interface ViewingContextAlertProps {
  mes: number | null;
  ano: number | null;
}

export function ViewingContextAlert({ mes, ano }: ViewingContextAlertProps) {
  const context = getViewingContext(mes, ano);

  const variantStyles = {
    success: "border-green-500/50 bg-green-500/10 text-green-500",
    warning: "border-orange-500/50 bg-orange-500/10 text-orange-500",
    destructive: "border-red-500/50 bg-red-500/10 text-red-500",
    default: "border-blue-500/50 bg-blue-500/10 text-blue-500",
  };

  return (
    <Alert className={variantStyles[context.variant]}>
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <span>{context.icon}</span>
        <span className="font-medium">{context.message}</span>
      </AlertDescription>
    </Alert>
  );
}
