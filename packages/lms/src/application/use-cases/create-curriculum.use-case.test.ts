import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { resetDI, setPortAdapter } from '@sota/core/di';
import { findLearnerProfileByIdPort, saveLearnerProfilePort } from '@lms/domain/learner/ports';
import { findSkillsByIdsPort } from '@lms/domain/skill/ports';
import { saveCurriculumPort } from '@lms/domain/curriculum/ports';
import { LearnerProfile } from '@lms/domain/learner/learner-profile.aggregate';
import { Competency } from '@lms/domain/competency/competency.vo';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { Curriculum } from '@lms/domain/curriculum/curriculum.aggregate';
import { createCurriculumUseCase } from './create-curriculum.use-case';

// --- Mocks ---
const mockFindLearnerProfileById = mock(async (dto: { id: string }) => null);
const mockFindSkillsByIds = mock(async (dto: { ids: string[] }) => []);
const mockSaveCurriculum = mock(async (curriculum: Curriculum) => {});

describe('createCurriculumUseCase', () => {
  beforeEach(() => {
    resetDI();
    mockFindLearnerProfileById.mockClear();
    mockFindSkillsByIds.mockClear();
    mockSaveCurriculum.mockClear();
    setPortAdapter(findLearnerProfileByIdPort, mockFindLearnerProfileById);
    setPortAdapter(findSkillsByIdsPort, mockFindSkillsByIds);
    setPortAdapter(saveCurriculumPort, mockSaveCurriculum);
  });

  it('should create a sequenced, multi-module curriculum', async () => {
    // --- 1. Arrange ---
    const learnerId = crypto.randomUUID();

    // Skills
    const skill1 = Skill.create({ id: crypto.randomUUID(), name: 'A' });
    const skill2 = Skill.create({ id: crypto.randomUUID(), name: 'B', prerequisiteSkillIds: [skill1.state.id] });
    const skill3 = Skill.create({ id: crypto.randomUUID(), name: 'C', prerequisiteSkillIds: [skill2.state.id] });

    // Learner has no skills
    const learnerProfile = LearnerProfile.create({ id: learnerId, competencies: [] });
    mockFindLearnerProfileById.mockResolvedValue(learnerProfile);

    // We need to mock the skills that will be fetched based on the gap
    mockFindSkillsByIds.mockResolvedValue([skill1, skill2, skill3]);

    // Target: learn skill C at level 1
    const targetCompetencies = [Competency.create({ skillId: skill3.state.id, level: 1 }).props];

    // --- 2. Act ---
    const result = await createCurriculumUseCase({ learnerId, targetCompetencies, strategyName: 'topological-sort' });

    // --- 3. Assert ---
    expect(result).toBeDefined();
    expect(mockSaveCurriculum).toHaveBeenCalledTimes(1);

    const savedCurriculum = mockSaveCurriculum.mock.calls[0][0];
    expect(savedCurriculum.state.modules).toHaveLength(3);

    // Check sequencing
    const module1 = savedCurriculum.state.modules[0];
    const module2 = savedCurriculum.state.modules[1];
    const module3 = savedCurriculum.state.modules[2];

    expect(module1.name).toBe('Module 1');
    expect(module1.transformations[0].skillId).toBe(skill1.state.id);

    expect(module2.name).toBe('Module 2');
    expect(module2.transformations[0].skillId).toBe(skill2.state.id);

    expect(module3.name).toBe('Module 3');
    expect(module3.transformations[0].skillId).toBe(skill3.state.id);
  });
});
