import { z } from 'zod';
import { createEntity } from '@sota/core/entity';
import { LanguageId } from './language.id';

const LanguagePropsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const Language = createEntity({
  schema: LanguagePropsSchema,
  actions: {},
});

export type Language = InstanceType<typeof Language>;
