import { z } from 'zod';
import { usePort } from '@sota/core/di';
import { findLearnerProfileByIdPort } from '@lms/domain/learner/ports';
import { Competency, CompetencyProps } from '@lms/domain/competency/competency.vo';

import { TransformationProps } from '@lms/domain/curriculum/transformation.vo';

export const GapAnalysisV2InputSchema = z.object({
  learnerProfileId: z.string().uuid(),
  targetCompetencies: z.array(z.custom<CompetencyProps>()),
});

export type GapAnalysisV2Input = z.infer<typeof GapAnalysisV2InputSchema>;

// The output will be the list of transformations that need to be done.
export type GapAnalysisV2Output = TransformationProps[];

export const gapAnalysisV2UseCase = async (input: GapAnalysisV2Input): Promise<GapAnalysisV2Output> => {
  const validInput = GapAnalysisV2InputSchema.parse(input);
  const { learnerProfileId, targetCompetencies } = validInput;

  const findLearnerProfileById = usePort(findLearnerProfileByIdPort);

  const learnerProfile = await findLearnerProfileById({ id: learnerProfileId });
  if (!learnerProfile) {
    throw new Error(`LearnerProfile with id ${learnerProfileId} not found.`);
  }

  const currentCompetenciesMap = new Map(
    learnerProfile.state.competencies.map(c => [c.skillId, c.level])
  );

  const gap: GapAnalysisV2Output = [];

  for (const target of targetCompetencies) {
    const currentLevel = currentCompetenciesMap.get(target.skillId);

    // Case 1: Skill is completely missing.
    if (!currentLevel) {
      gap.push({ 
        skillId: target.skillId,
        fromLevel: 0,
        toLevel: target.level
      });
    } 
    // Case 2: Skill level is insufficient.
    else if (currentLevel < target.level) {
      gap.push({ 
        skillId: target.skillId,
        fromLevel: currentLevel,
        toLevel: target.level
      });
    }
  }

  return gap;
};
