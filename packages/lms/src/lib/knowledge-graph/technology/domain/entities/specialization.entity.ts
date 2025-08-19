import { z } from 'zod';
import { createEntity } from '@sota/core/entity';
import { SpecializationId } from './specialization.id';
import { FrameworkId } from './framework.id';

const SpecializationPropsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  frameworkIds: z.array(z.string().uuid()).default([]), // Storing IDs as strings
});

export const Specialization = createEntity({
  schema: SpecializationPropsSchema,
  actions: {
    addFramework: (state, frameworkId: string) => {
        return { ...state, frameworkIds: [...state.frameworkIds, frameworkId] };
    }
  },
});

export type Specialization = InstanceType<typeof Specialization>;
