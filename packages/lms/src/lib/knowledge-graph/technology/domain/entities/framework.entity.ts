import { z } from 'zod';
import { createEntity } from '@sota/core/entity';
import { FrameworkId } from './framework.id';
import { RuntimeId } from './runtime.id';

const FrameworkPropsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  runtimeId: z.string().uuid(), // Storing ID as string in props
});

export const Framework = createEntity({
  schema: FrameworkPropsSchema,
  actions: {},
});

export type Framework = InstanceType<typeof Framework>;
