import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWebApp } from '../telegram/webapp';

export function useTelegramBackButton(enabled = true, to?: string | number) {
  const navigate = useNavigate();

  useEffect(() => {
    const wa = getWebApp();
    if (!wa || !enabled) {
      wa?.BackButton.hide();
      return;
    }

    const handler = () => {
      if (typeof to === 'string') navigate(to);
      else if (typeof to === 'number') navigate(to);
      else navigate(-1);
    };

    wa.BackButton.show();
    wa.BackButton.onClick(handler);
    return () => {
      wa.BackButton.offClick(handler);
      wa.BackButton.hide();
    };
  }, [enabled, navigate, to]);
}
