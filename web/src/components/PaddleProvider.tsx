import React, { useEffect } from 'react';
import { initializePaddle } from '../utils/paddle';

export function PaddleProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
    const environment = (import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox') as
      | 'sandbox'
      | 'production';

    if (!clientToken) {
      console.warn(
        'Paddle client token not found. Please set VITE_PADDLE_CLIENT_TOKEN in your .env file.'
      );
      return;
    }

    let retries = 0;
    const maxRetries = 50;

    const checkPaddle = () => {
      if (typeof window !== 'undefined' && window.Paddle) {
        initializePaddle(clientToken, environment).catch((error) => {
          console.error('Failed to initialize Paddle:', error);
        });
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(checkPaddle, 100);
      } else {
        console.error('Paddle.js failed to load after maximum retries');
      }
    };

    checkPaddle();
  }, []);

  return <>{children}</>;
}
