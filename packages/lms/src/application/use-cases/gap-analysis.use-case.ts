import { z } from 'zod';
import { usePort } from '@sota/core/di';
import { findSkillByIdPort, findSkillsByIdsPort } from '@lms/domain/skill/ports';
import { SkillTree } from '@lms/domain/skill/skill-tree.vo';
import { Skill } from '@lms/domain/skill/skill.aggregate';

// 1. Input Schema
export const GapAnalysisInputSchema = z.object({
  skillAId: z.string().uuid(),
  skillBId: z.string().uuid(),
});
export type GapAnalysisInput = z.infer<typeof GapAnalysisInputSchema>;

// The use case function
export const gapAnalysisUseCase = async (input: GapAnalysisInput): Promise<SkillTree> => {
  // 2. Validate input
  const validInput = GapAnalysisInputSchema.parse(input);

  // 3. Declare dependencies
  const findSkillById = usePort(findSkillByIdPort);
  const findSkillsByIds = usePort(findSkillsByIdsPort);

  // 4. Logic
  const { skillAId, skillBId } = validInput;

  const skillA = await findSkillById({ id: skillAId });
  const skillB = await findSkillById({ id: skillBId });

  if (!skillA || !skillB) {
    throw new Error("One or both skills not found.");
  }

  // Helper function to get all prerequisites for a skill (recursively)
  const getAllPrerequisites = async (skill: Skill, allSkills = new Map<string, Skill>()): Promise<Map<string, Skill>> => {
    if (!allSkills.has(skill.state.id)) {
        allSkills.set(skill.state.id, skill);
        if (skill.state.prerequisiteSkillIds.length > 0) {
            const prerequisites = await findSkillsByIds({ ids: skill.state.prerequisiteSkillIds });
            for (const prereq of prerequisites) {
                await getAllPrerequisites(prereq, allSkills);
            }
        }
    }
    return allSkills;
  };

  const prerequisitesA = await getAllPrerequisites(skillA);
  const prerequisitesB = await getAllPrerequisites(skillB);

  const gapSkills: Skill[] = [];
  for (const [id, skill] of prerequisitesB.entries()) {
      if (!prerequisitesA.has(id)) {
          gapSkills.push(skill);
      }
  }
  
  const gapSkillIds = new Set(gapSkills.map(s => s.state.id));
  const rootSkillIds = gapSkills
    .filter(skill => 
        skill.state.prerequisiteSkillIds.every(prereqId => !gapSkillIds.has(prereqId))
    )
    .map(skill => skill.state.id);


  const skillTree = SkillTree.create({
      skills: gapSkills.map(s => s.state),
      rootSkillIds: rootSkillIds,
  });

  return skillTree;
};
