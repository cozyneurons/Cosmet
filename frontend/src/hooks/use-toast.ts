import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    const message = title && description ? `${title}: ${description}` : (title || description || "");
    if (variant === "destructive") {
      sonnerToast.error(message);
    } else {
      sonnerToast(message);
    }
  };

  return {
    toast,
  };
}

export { sonnerToast as toast };
