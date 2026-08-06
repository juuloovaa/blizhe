import { toast } from 'sonner';

export function toastError(message: string) {
  toast.error(message.startsWith('упс') ? message : `упс — ${message}`, {
    duration: 4200,
  });
}

export function toastSuccess(message: string) {
  toast.success(message, { duration: 2800 });
}
