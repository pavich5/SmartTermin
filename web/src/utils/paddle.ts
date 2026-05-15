declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (env: 'sandbox' | 'production') => void;
      };
      Initialize: (config: { token: string }) => void;
      PricePreview: (request: { items: Array<{ quantity: number; priceId: string }> }) => Promise<{
        data: {
          details: {
            lineItems: Array<{
              price: {
                id: string;
              };
              formattedTotals: {
                subtotal: string;
              };
            }>;
          };
        };
      }>;
      Checkout: {
        open: (config: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: {
            email?: string;
            name?: string;
          };
          customData?: Record<string, any>;
          settings?: {
            successUrl?: string;
            displayMode?: 'overlay' | 'inline';
            theme?: string;
            locale?: string;
          };
          eventCallback?: (data: any) => void;
        }) => void;
      };
    };
  }
}

let paddleInitialized = false;
let initializationPromise: Promise<void> | null = null;
export function initializePaddle(
  clientToken: string,
  environment: 'sandbox' | 'production' = 'sandbox'
) {
  if (typeof window === 'undefined' || !window.Paddle) {
    console.error('Paddle.js is not loaded. Make sure the script is included in index.html');
    return Promise.resolve();
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve) => {
    try {
      window.Paddle!.Environment.set(environment);
      window.Paddle!.Initialize({
        token: clientToken,
      });

      setTimeout(() => {
        paddleInitialized = true;
        resolve();
      }, 200);
    } catch (error) {
      console.error('Error initializing Paddle:', error);
      paddleInitialized = false;
      resolve();
    }
  });

  return initializationPromise;
}

export async function getPricePreview(
  items: Array<{ quantity: number; priceId: string }>
): Promise<{
  data: {
    details: {
      lineItems: Array<{
        price: {
          id: string;
        };
        formattedTotals: {
          subtotal: string;
        };
      }>;
    };
  };
}> {
  if (typeof window === 'undefined' || !window.Paddle) {
    throw new Error('Paddle.js is not loaded');
  }

  if (initializationPromise && !paddleInitialized) {
    await initializationPromise;
  }

  if (!isPaddleInitialized()) {
    throw new Error(
      'Paddle.js is not initialized. Make sure VITE_PADDLE_CLIENT_TOKEN is set in your .env file.'
    );
  }

  try {
    const result = await window.Paddle.PricePreview({ items });
    return result;
  } catch (error) {
    console.error('Paddle PricePreview error:', error);
    throw error;
  }
}

export async function openPaddleCheckout(
  priceId: string,
  quantity: number = 1,
  customerEmail?: string,
  customData?: Record<string, any>,
  onCheckoutComplete?: (data: any) => void | Promise<void>,
  successUrlOverride?: string
) {
  if (typeof window === 'undefined') {
    console.error('Window is undefined');
    return;
  }

  if (!window.Paddle) {
    console.error('Paddle.js is not loaded');
    return;
  }

  if (initializationPromise && !paddleInitialized) {
    await initializationPromise;
  }

  if (!isPaddleInitialized()) {
    console.error(
      'Paddle.js is not initialized. Make sure VITE_PADDLE_CLIENT_TOKEN is set in your .env file.'
    );
    return;
  }

  if (!window.Paddle.Checkout || !window.Paddle.Checkout.open) {
    console.error('Paddle.Checkout.open is not available');
    return;
  }

  try {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const successUrl = successUrlOverride || `${currentUrl}/payment/success`;
    const failureUrl = `${currentUrl}/payment/failure`;

    const checkoutConfig = {
      items: [{ priceId, quantity }],
      ...(customerEmail && {
        customer: {
          email: customerEmail,
          ...(customData?.userName && { name: customData.userName }),
        },
      }),
      ...(customData && { customData }),
      settings: {
        successUrl: successUrl,
        displayMode: 'overlay' as const,
      },
      eventCallback: async (data: any) => {
        if (data.name === 'checkout.error') {
          console.error('=== PADDLE CHECKOUT ERROR ===');
          console.error('Full error data:', JSON.stringify(data, null, 2));
          if (data.data?.error) {
            console.error('Error object:', JSON.stringify(data.data.error, null, 2));
          }
          if (data.data?.message) {
            console.error('Error message:', data.data.message);
          }
          if (data.data?.detail) {
            console.error('Error detail:', data.data.detail);
          }
          setTimeout(() => {
            window.location.href = failureUrl;
          }, 1500);
        }

        if (data.name === 'checkout.completed') {
          const transactionId = data.data?.transactionId;
          const status = data.data?.status;

          if (status === 'completed' || transactionId) {
            if (onCheckoutComplete) {
              try {
                await onCheckoutComplete(data);
              } catch (callbackError) {
                console.error('Error running checkout completion handler:', callbackError);
              }
            }
          } else {
            console.warn('Checkout completed but status unclear:', data);
            setTimeout(() => {
              window.location.href = failureUrl;
            }, 1500);
          }
        }

        if (data.name === 'checkout.warning') {
          console.warn('Paddle checkout warning:', data);
        }

        if (data.name === 'checkout.closed') {
          const wasCompleted = data.data?.completed;

          if (wasCompleted) {
            if (onCheckoutComplete) {
              try {
                await onCheckoutComplete(data);
                return;
              } catch (callbackError) {
                console.error('Error running checkout completion handler on close:', callbackError);
              }
            }
            // If completed but no callback, still send to success URL
            window.location.href = successUrl;
            return;
          }

          setTimeout(() => {
            window.location.href = failureUrl;
          }, 1000);
        }
      },
    };

    window.Paddle.Checkout.open(checkoutConfig);
  } catch (error) {
    console.error('Error opening Paddle checkout:', error);
  }
}

export function isPaddleLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.Paddle !== 'undefined';
}

export async function openPaddleCheckoutWithTransaction(transactionId: string) {
  if (typeof window === 'undefined') {
    console.error('Window is undefined');
    return;
  }

  if (!window.Paddle) {
    console.error('Paddle.js is not loaded');
    return;
  }

  if (initializationPromise && !paddleInitialized) {
    await initializationPromise;
  }

  if (!isPaddleInitialized()) {
    console.error(
      'Paddle.js is not initialized. Make sure VITE_PADDLE_CLIENT_TOKEN is set in your .env file.'
    );
    return;
  }

  if (!window.Paddle.Checkout || !window.Paddle.Checkout.open) {
    console.error('Paddle.Checkout.open is not available');
    return;
  }

  const env = (import.meta as any).env;
  const paddleEnvironment = (env?.VITE_PADDLE_ENVIRONMENT || 'production') as 'sandbox' | 'production';

  try {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const successUrl = `${currentUrl}/payment/success`;

    // Extract transaction ID from URL if it's a full URL
    let txId = transactionId;
    if (transactionId.includes('_ptxn=')) {
      const url = new URL(transactionId);
      txId = url.searchParams.get('_ptxn') || transactionId;
    } else if (transactionId.includes('?')) {
      const url = new URL(transactionId);
      txId = url.searchParams.get('_ptxn') || transactionId;
    }

    // Use Paddle Checkout.open with transaction ID
    // Note: Paddle might support transactionId directly, or we need to use a different approach
    const checkoutConfig: any = {
      transactionId: txId,
      settings: {
        successUrl: successUrl,
        displayMode: 'overlay' as const,
      },
      eventCallback: (data: any) => {
        if (data.name === 'checkout.completed') {
          const status = data.data?.status;
          if (status === 'completed') {
            // Reload the page to refresh subscription status
            window.location.reload();
          }
        }
        if (data.name === 'checkout.closed') {
          const wasCompleted = data.data?.completed;
          if (!wasCompleted) {
            // User closed without completing
          }
        }
      },
    };

    window.Paddle.Checkout.open(checkoutConfig);
  } catch (error) {
    console.error('Error opening Paddle checkout with transaction:', error);
    // Fallback: open the URL in an overlay/iframe
    // Use environment determined at top of function
    const checkoutBaseUrl = paddleEnvironment === 'sandbox' 
      ? 'https://sandbox-checkout.paddle.com'
      : 'https://checkout.paddle.com';
    
    const checkoutUrl = transactionId.startsWith('http') 
      ? transactionId 
      : `${checkoutBaseUrl}/checkout/${transactionId}`;
    
    // Open in a new window as fallback
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  }
}

export function isPaddleInitialized(): boolean {
  if (!isPaddleLoaded()) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env;
  const hasToken = !!env?.VITE_PADDLE_CLIENT_TOKEN;
  return hasToken && paddleInitialized;
}
