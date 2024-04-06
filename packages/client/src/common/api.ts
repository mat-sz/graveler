import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink,
} from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import type { Router } from '@graveler/graveler';

declare global {
  interface Window {
    wsOnOpen?: () => void;
    wsOnClose?: () => void;
  }
}

const apiUrl = new URL('/trpc', window.location.href).toString();
const link = splitLink({
  condition: op => op.type === 'subscription',
  true: wsLink({
    client: createWSClient({
      url: apiUrl,
      onOpen: () => {
        window.wsOnOpen?.();
      },
      onClose: () => {
        window.wsOnClose?.();
      },
    }),
  }),
  false: httpBatchLink({ url: apiUrl }),
});
export const API = createTRPCClient<Router>({
  links: [link],
});

export const TRPC = createTRPCReact<Router>();
export const TRPCClient = TRPC.createClient({
  links: [link],
});
