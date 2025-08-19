import { z } from 'zod';
import { createEntity } from '@sota/core/entity';

const DddValueObjectPropsSchema = z.object({
  /** The unique identifier for this knowledge concept. */
  id: z.string().uuid(),
  /** The name of the DDD pattern, e.g., "Value Object". */
  name: z.string(),
  /** A detailed explanation of the pattern's purpose and use. */
  description: z.string(),
});

/**
 * Represents the concept of a "Value Object" within the DDD knowledge graph.
 * A Value Object is an object defined by its attributes rather than a unique identity.
 * Examples include Money, Color, or a date range.
 */

export const DddValueObject = createEntity({
  schema: DddValueObjectPropsSchema,
  actions: {},
});

export type DddValueObject = InstanceType<typeof DddValueObject>;
