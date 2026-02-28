import { toast as showToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default' | 'destructive';

interface ToastProps {
  title: string | undefined;
  description?: string|React.ReactNode;
  variant?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const toast = (props: ToastProps) => {
    const { title, description, variant = 'default', duration, action } = props;
    const options = {
      description,
      duration,
      action,
    };

    if (variant === 'destructive' ) {
      showToast.error(title ?? 'Error', options);
    } else if (variant === 'default') {
      showToast(title ?? variant, options);
    } else {
      showToast[variant as 'success' | 'error' | 'info' | 'warning'](title ?? variant, options);
    }
  };

  return { toast };
};