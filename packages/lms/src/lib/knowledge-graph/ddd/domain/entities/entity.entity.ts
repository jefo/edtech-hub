import { z } from 'zod';
import { createEntity } from '@sota/core/entity';

const DddEntityPropsSchema = z.object({
  /** The unique identifier for this knowledge concept. */
  id: z.string().uuid(),
  /** The name of the DDD pattern, e.g., "Entity". */
  name: z.string(),
  /** A detailed explanation of the pattern's purpose and use. */
  description: z.string(),
});

/**
 * Represents the concept of an "Entity" within the DDD knowledge graph.
 * An Entity is an object with a distinct, continuous identity, allowing it to change
 * its attributes over time while remaining the "same" object.
 */

export const DddEntity = createEntity({
  schema: DddEntityPropsSchema,
  actions: {},
});

export type DddEntity = InstanceType<typeof DddEntity>;
