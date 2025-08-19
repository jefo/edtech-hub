import { z } from 'zod';
import { usePort } from '@sota/core/di';
import { findLearnerProfileByIdPort } from '@lms/domain/learner/ports';
import { findSkillsByIdsPort } from '@lms/domain/skill/ports';
import { saveCurriculumPort } from '@lms/domain/curriculum/ports';
import { Competency, CompetencyProps } from '@lms/domain/competency/competency.vo';
import { gapAnalysisV2UseCase } from './gap-analysis-v2.use-case';
import { Curriculum } from '@lms/domain/curriculum/curriculum.aggregate';
import { Module } from '@lms/domain/curriculum/module.entity';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { Transformation } from '@lms/domain/curriculum/transformation.vo';
import { ICurriculumSequencingStrategy } from '../strategies/sequencing.strategy';
import { TopologicalSortStrategy } from '../strategies/topological-sort.strategy';
import { ImmersivePracticeStrategy } from '../strategies/immersive-practice.strategy';

// Strategy Map
const strategies: Record<string, ICurriculumSequencingStrategy> = {
  'default': new TopologicalSortStrategy(),
  'topological-sort': new TopologicalSortStrategy(),
  'immersive-practice': new ImmersivePracticeStrategy(),
};

export const CreateCurriculumInputSchema = z.object({
  learnerId: z.string().uuid(),
  targetCompetencies: z.array(z.custom<CompetencyProps>()),
  strategyName: z.string().default('default'),
});

export type CreateCurriculumInput = z.infer<typeof CreateCurriculumInputSchema>;

export const createCurriculumUseCase = async (input: CreateCurriculumInput) => {
  const { learnerId, targetCompetencies, strategyName } = CreateCurriculumInputSchema.parse(input);

  const strategy = strategies[strategyName];
  if (!strategy) {
    throw new Error(`Unknown curriculum strategy: ${strategyName}`);
  }

  // --- 1. Ports & Dependencies ---
  const findLearnerProfileById = usePort(findLearnerProfileByIdPort);
  const findSkillsByIds = usePort(findSkillsByIdsPort);
  const saveCurriculum = usePort(saveCurriculumPort);

  // --- 2. Initial Gap Analysis ---
  const learnerProfile = await findLearnerProfileById({ id: learnerId });
  if (!learnerProfile) throw new Error('Learner not found');

  const initialGaps = await gapAnalysisV2UseCase({
    learnerProfileId: learnerId,
    targetCompetencies,
  });

  if (initialGaps.length === 0) {
    return null; // No curriculum needed
  }

  // --- 3. Scaffolding: Find all prerequisite skills ---
  const allRequiredSkills = new Map<string, Skill>();
  const skillsToFetch = new Set(initialGaps.map(g => g.skillId));
  const fetchedSkills = new Set<string>();

  while (skillsToFetch.size > 0) {
    const currentBatch = Array.from(skillsToFetch);
    skillsToFetch.clear();
    currentBatch.forEach(id => fetchedSkills.add(id));

    const skills = await findSkillsByIds({ ids: currentBatch });
    for (const skill of skills) {
      allRequiredSkills.set(skill.state.id, skill);
      skill.state.prerequisiteSkillIds.forEach(prereqId => {
        if (!fetchedSkills.has(prereqId)) {
          skillsToFetch.add(prereqId);
        }
      });
    }
  }

  // --- 4. Full Gap Analysis ---
  const fullTargetCompetencies = Array.from(allRequiredSkills.keys()).map(skillId => {
    return targetCompetencies.find(t => t.skillId === skillId) || Competency.create({ skillId, level: 1 }).props;
  });

  const allCompetencyGaps = await gapAnalysisV2UseCase({
    learnerProfileId: learnerId,
    targetCompetencies: fullTargetCompetencies,
  });

  // --- 5. Clustering & Sequencing (Delegated to Strategy) ---
  const modules = strategy.sequence(allCompetencyGaps, allRequiredSkills);

  // --- 6. Create and Save Curriculum ---
  const curriculum = Curriculum.create({
    id: crypto.randomUUID(),
    learnerId,
    targetCompetencies,
    modules: modules, // Modules are now ModuleProps[], not Module[]
  });

  await saveCurriculum(curriculum);

  return { curriculumId: curriculum.state.id };
};