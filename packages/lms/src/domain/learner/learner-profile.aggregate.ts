import { z } from 'zod';
import { createAggregate } from '@sota/core/aggregate';
import { CompetencyProps } from '@lms/domain/competency/competency.vo';

const LearnerProfilePropsSchema = z.object({
  id: z.string().uuid(), // Represents the learner's ID
  competencies: z.array(z.custom<CompetencyProps>()).default([]),
});

export type LearnerProfileProps = z.infer<typeof LearnerProfilePropsSchema>;

export const LearnerProfile = createAggregate({
  name: 'LearnerProfile',
  schema: LearnerProfilePropsSchema,
  invariants: [],
  actions: {
    achieveCompetency: (state: LearnerProfileProps, newCompetency: CompetencyProps) => {
      const existingCompetencyIndex = state.competencies.findIndex(
        c => c.skillId === newCompetency.skillId
      );

      let newCompetencies = [...state.competencies];

      if (existingCompetencyIndex > -1) {
        // Update level only if the new one is higher
        if (newCompetencies[existingCompetencyIndex].level < newCompetency.level) {
          newCompetencies[existingCompetencyIndex] = newCompetency;
        }
      } else {
        // Add new competency
        newCompetencies.push(newCompetency);
      }
      
      return { state: { ...state, competencies: newCompetencies } };
    },
  },
});

export type LearnerProfile = InstanceType<typeof LearnerProfile>;
