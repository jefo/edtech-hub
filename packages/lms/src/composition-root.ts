import { setPortAdapter } from '@sota/core/di';
import { findSkillByIdPort, findSkillsByIdsPort, saveSkillPort } from '@lms/domain/skill/ports';
import { findLearnerProfileByIdPort, saveLearnerProfilePort } from '@lms/domain/learner/ports';
import { findCurriculumByIdPort, saveCurriculumPort } from '@lms/domain/curriculum/ports';
import { inMemorySkillAdapter } from './infrastructure/in-memory/skill.adapter';
import { inMemoryLearnerProfileAdapter } from './infrastructure/in-memory/learner-profile.adapter';
import { inMemoryCurriculumAdapter } from './infrastructure/in-memory/curriculum.adapter';

// This function binds the abstract ports to their concrete in-memory implementations.
export const compose = () => {
    // Skill Ports
    setPortAdapter(findSkillByIdPort, inMemorySkillAdapter.findSkillById);
    setPortAdapter(findSkillsByIdsPort, inMemorySkillAdapter.findSkillsByIds);
    setPortAdapter(saveSkillPort, inMemorySkillAdapter.saveSkill);

    // Learner Profile Ports
    setPortAdapter(findLearnerProfileByIdPort, inMemoryLearnerProfileAdapter.findLearnerProfileById);
    setPortAdapter(saveLearnerProfilePort, inMemoryLearnerProfileAdapter.saveLearnerProfile);

    // Curriculum Ports
    setPortAdapter(findCurriculumByIdPort, inMemoryCurriculumAdapter.findCurriculumById);
    setPortAdapter(saveCurriculumPort, inMemoryCurriculumAdapter.saveCurriculum);

    console.log('[CompositionRoot] In-memory adapters have been set.');
};