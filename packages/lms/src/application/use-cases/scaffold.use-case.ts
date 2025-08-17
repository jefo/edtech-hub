import { z } from 'zod';
import { usePort } from '@sota/core/di';
import { findSkillByIdPort, findSkillsByIdsPort } from '@lms/domain/skill/ports';
import { SkillTree } from '@lms/domain/skill/skill-tree.vo';
import { Skill } from '@lms/domain/skill/skill.aggregate';

export const ScaffoldInputSchema = z.object({
  startSkillId: z.string().uuid(),
  endSkillId: z.string().uuid(),
});
export type ScaffoldInput = z.infer<typeof ScaffoldInputSchema>;

export const scaffoldUseCase = async (input: ScaffoldInput): Promise<SkillTree> => {
  const validInput = ScaffoldInputSchema.parse(input);
  const { startSkillId, endSkillId } = validInput;

  const findSkillById = usePort(findSkillByIdPort);
  const findSkillsByIds = usePort(findSkillsByIdsPort);

  const startSkill = await findSkillById({ id: startSkillId });
  const endSkill = await findSkillById({ id: endSkillId });

  if (!startSkill || !endSkill) {
    throw new Error("One or both skills not found.");
  }

  // Helper to get all prerequisites for a skill
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

  const startSkillPrereqs = await getAllPrerequisites(startSkill);
  const endSkillPrereqs = await getAllPrerequisites(endSkill);

  // The scaffold is the set of skills that are prerequisites for the end skill,
  // but are not prerequisites for the start skill (excluding the start skill itself).
  const scaffoldSkills: Skill[] = [];
  for (const [id, skill] of endSkillPrereqs.entries()) {
      if (!startSkillPrereqs.has(id) && id !== startSkillId) {
          scaffoldSkills.push(skill);
      }
  }

  // Determine the root nodes for the scaffold tree.
  // A root is a skill in the scaffold whose prerequisites are NOT in the scaffold.
  const scaffoldSkillIds = new Set(scaffoldSkills.map(s => s.state.id));
  const rootSkillIds = scaffoldSkills
    .filter(skill => 
        skill.state.prerequisiteSkillIds.every(prereqId => !scaffoldSkillIds.has(prereqId))
    )
    .map(skill => skill.state.id);

  return SkillTree.create({
    skills: scaffoldSkills.map(s => s.state),
    rootSkillIds: rootSkillIds,
  });
};
