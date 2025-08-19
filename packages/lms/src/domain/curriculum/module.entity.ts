import { z } from 'zod';
import { createEntity } from '@sota/core/entity';

const ModulePropsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  // A module is composed of an ordered list of lesson IDs.
  lessonIds: z.array(z.string().uuid()),
});

export type ModuleProps = z.infer<typeof ModulePropsSchema>;

export const Module = createEntity({
  schema: ModulePropsSchema,
  actions: {
    // Example: re-ordering lessons within a module
    setLessonOrder: (state: ModuleProps, newLessonIds: string[]) => {
        // In a real app, you'd validate that all IDs exist.
        return { ...state, lessonIds: newLessonIds };
    },
  },
});

export type Module = InstanceType<typeof Module>;