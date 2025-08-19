import { z } from 'zod';
import { createEntity } from '@sota/core/entity';
import { RuntimeId } from './runtime.id';
import { LanguageId } from './language.id';

const RuntimePropsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  languageId: z.string().uuid(), // Storing ID as string in props
});

export const Runtime = createEntity({
  schema: RuntimePropsSchema,
  actions: {},
});

export type Runtime = InstanceType<typeof Runtime>;
