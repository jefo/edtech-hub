import { z } from 'zod';
import { createEntity } from '@sota/core/entity';

const DddAggregatePropsSchema = z.object({
  /** The unique identifier for this knowledge concept. */
  id: z.string().uuid(),
  /** The name of the DDD pattern, e.g., "Aggregate". */
  name: z.string(),
  /** A detailed explanation of the pattern's purpose and use. */
  description: z.string(),
  /**
   * A list of IDs pointing to the DddEntity concepts that an Aggregate is typically composed of.
   * This establishes a "IS_COMPOSED_OF" semantic relationship.
   */
  entityIds: z.array(z.string().uuid()).default([]),
  /**
   * A list of IDs pointing to the DddValueObject concepts that an Aggregate is typically composed of.
   * This establishes a "IS_COMPOSED_OF" semantic relationship.
   */
  valueObjectIds: z.array(z.string().uuid()).default([]),
});

/**
 * Represents the concept of an "Aggregate" within the DDD knowledge graph.
 * An Aggregate is a transactional consistency boundary that groups a cluster of
 * related Entities and Value Objects, treating them as a single unit.
 */

export const DddAggregate = createEntity({
  schema: DddAggregatePropsSchema,
  actions: {
    addEntity: (state, entityId: string) => {
        return { ...state, entityIds: [...state.entityIds, entityId] };
    },
    addValueObject: (state, voId: string) => {
        return { ...state, valueObjectIds: [...state.valueObjectIds, voId] };
    }
  },
});

export type DddAggregate = InstanceType<typeof DddAggregate>;
