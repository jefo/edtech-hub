import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { resetDI, setPortAdapter } from '@sota/core/di';
import { findLearnerProfileByIdPort, saveLearnerProfilePort } from '@lms/domain/learner/ports';
import { LearnerProfile } from '@lms/domain/learner/learner-profile.aggregate';
import { Competency, CompetencyProps } from '@lms/domain/competency/competency.vo';
import { gapAnalysisV2UseCase } from './gap-analysis-v2.use-case';

// --- Test Data ---
const skillId1 = crypto.randomUUID();
const skillId2 = crypto.randomUUID();
const skillId3 = crypto.randomUUID();
const skillId4 = crypto.randomUUID();

const learnerId = crypto.randomUUID();

// The learner knows skill 1 at level 2, and skill 2 at level 1.
const currentProfile = LearnerProfile.create({
    id: learnerId,
    competencies: [
        Competency.create({ skillId: skillId1, level: 2 }).props,
        Competency.create({ skillId: skillId2, level: 1 }).props,
    ]
});

const mockLearnerDb = new Map<string, LearnerProfile>();
mockLearnerDb.set(learnerId, currentProfile);

// --- Mocks ---
const mockFindLearnerProfileById = mock(async ({ id }: { id: string }) => {
    return mockLearnerDb.get(id) || null;
});

describe('gapAnalysisV2UseCase', () => {
    beforeEach(() => {
        resetDI();
        setPortAdapter(findLearnerProfileByIdPort, mockFindLearnerProfileById);
    });

    it('should identify both missing skills and skills with insufficient levels', async () => {
        // Target: Skill 1 -> L3, Skill 2 -> L1 (no change), Skill 3 -> L1 (new)
        const targetCompetencies: CompetencyProps[] = [
            Competency.create({ skillId: skillId1, level: 3 }).props, // Needs level up
            Competency.create({ skillId: skillId2, level: 1 }).props, // Already has this
            Competency.create({ skillId: skillId3, level: 1 }).props, // New skill
        ];

        const input = { learnerProfileId: learnerId, targetCompetencies };

        const gap = await gapAnalysisV2UseCase(input);

        expect(gap).toHaveLength(2);

        // Check for the skill that needs a level up
        const skill1Gap = gap.find(c => c.skillId === skillId1);
        expect(skill1Gap).toBeDefined();
        expect(skill1Gap?.fromLevel).toBe(2);
        expect(skill1Gap?.toLevel).toBe(3);

        // Check for the new skill
        const skill3Gap = gap.find(c => c.skillId === skillId3);
        expect(skill3Gap).toBeDefined();
        expect(skill3Gap?.fromLevel).toBe(0);
        expect(skill3Gap?.toLevel).toBe(1);

        // Ensure skill 2 is not in the gap
        const skill2Gap = gap.find(c => c.skillId === skillId2);
        expect(skill2Gap).toBeUndefined();
    });

    it('should return an empty array if all competencies are met', async () => {
        const targetCompetencies: CompetencyProps[] = [
            Competency.create({ skillId: skillId1, level: 1 }).props, 
            Competency.create({ skillId: skillId2, level: 1 }).props, 
        ];

        const input = { learnerProfileId: learnerId, targetCompetencies };

        const gap = await gapAnalysisV2UseCase(input);

        expect(gap).toHaveLength(0);
    });

    it('should throw an error if the learner profile is not found', async () => {
        const invalidInput = {
            learnerProfileId: crypto.randomUUID(),
            targetCompetencies: [],
        };

        await expect(gapAnalysisV2UseCase(invalidInput)).rejects.toThrow();
    });
});
