import { z } from 'zod';
import { createAggregate } from '@sota/core/aggregate';

// Using z.string().uuid() as per sotajs examples.
export const SkillPropsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Skill name cannot be empty."),
  description: z.string().optional(),
  prerequisiteSkillIds: z.array(z.string().uuid()).default([]),
});

// Exporting the type for use in other parts of the domain.
export type SkillProps = z.infer<typeof SkillPropsSchema>;

export const Skill = createAggregate({
  name: 'Skill',
  schema: SkillPropsSchema,
  invariants: [
    (state) => {
      if (state.prerequisiteSkillIds.includes(state.id)) {
        throw new Error("A skill cannot be a prerequisite of itself.");
      }
    },
  ],
  actions: {
    // Example action: add a prerequisite
    addPrerequisite: (state: SkillProps, prerequisiteId: string) => {
      if (state.prerequisiteSkillIds.includes(prerequisiteId) || state.id === prerequisiteId) {
        // No change needed or invalid operation
        return { state };
      }
      const newState = {
        ...state,
        prerequisiteSkillIds: [...state.prerequisiteSkillIds, prerequisiteId],
      };
      return { state: newState };
    },
    // Example action: change the name
    changeName: (state: SkillProps, newName: string) => {
        const newState = { ...state, name: newName };
        return { state: newState };
    }
  },
});

// Exporting the aggregate type itself
export type Skill = InstanceType<typeof Skill>;
