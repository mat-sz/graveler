import { initTRPC } from '@trpc/server';
import { z } from 'zod';

import { execute } from './execution.js';
import { NODES } from './nodes/index.js';
import { NodeType } from './types.js';

export interface TRPCContext {}

export const t = initTRPC.context<TRPCContext>().create();

export const router = t.router({
  flow: {
    execute: t.procedure.input(z.any()).mutation(async ({ input }) => {
      return await execute(input);
    }),
  },
  node: {
    all: t.procedure.query(() => {
      return Object.fromEntries(
        Object.entries(NODES).map(([key, node]) => [
          key,
          { ...node, run: undefined } as NodeType,
        ]),
      );
    }),
  },
});

export type Router = typeof router;

export * from './types.js';
