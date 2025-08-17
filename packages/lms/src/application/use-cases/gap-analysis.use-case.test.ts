import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { resetDI, setPortAdapter } from '@sota/core/di';
import { findSkillByIdPort, findSkillsByIdsPort } from '@lms/domain/skill/ports';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { gapAnalysisUseCase } from './gap-analysis.use-case';
import { SkillTree } from '@lms/domain/skill/skill-tree.vo';

// --- Test Data ---
const skillsDb = new Map<string, Skill>();

const skill1 = Skill.create({ id: 'c5b2c6f8-9497-4f00-916a-8a1709a6a8ea', name: 'Basic Algebra', prerequisiteSkillIds: [] });
const skill2 = Skill.create({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Calculus I', prerequisiteSkillIds: [skill1.state.id] });
const skill3 = Skill.create({ id: 'e8a5b5a0-5bfa-4a0e-8b0a-0e02b2c3d47a', name: 'Linear Algebra', prerequisiteSkillIds: [skill1.state.id] });
const skill4 = Skill.create({ id: 'a1b2c3d4-e5f6-4890-8234-567890abcdef', name: 'Calculus II', prerequisiteSkillIds: [skill2.state.id] });

skillsDb.set(skill1.state.id, skill1);
skillsDb.set(skill2.state.id, skill2);
skillsDb.set(skill3.state.id, skill3);
skillsDb.set(skill4.state.id, skill4);


// --- Mocks ---
const mockFindSkillById = mock(async ({ id }: { id: string }) => {
    return skillsDb.get(id) || null;
});

const mockFindSkillsByIds = mock(async ({ ids }: { ids: string[] }) => {
    return ids.map(id => skillsDb.get(id)).filter(Boolean) as Skill[];
});

describe('gapAnalysisUseCase', () => {
    beforeEach(() => {
        resetDI();
        setPortAdapter(findSkillByIdPort, mockFindSkillById);
        setPortAdapter(findSkillsByIdsPort, mockFindSkillsByIds);
    });

    it('should return an empty skill tree if skill A already covers skill B', async () => {
        const input = { skillAId: skill4.state.id, skillBId: skill2.state.id };
        const result = await gapAnalysisUseCase(input);

        expect(result).toBeInstanceOf(SkillTree);
        expect(result.props.skills).toHaveLength(0);
        expect(result.props.rootSkillIds).toHaveLength(0);
    });

    it('should return the missing skills as a gap', async () => {
        // Gap between Calc II (B) and Basic Algebra (A) should be Calculus I.
        const input = { skillAId: skill1.state.id, skillBId: skill4.state.id };
        const result = await gapAnalysisUseCase(input);

        expect(result.props.skills).toHaveLength(2); // Calc I and Calc II
        
        const skillNames = result.props.skills.map(s => s.name);
        expect(skillNames).toContain('Calculus I');
        expect(skillNames).toContain('Calculus II');

        // The root of the gap should be Calculus I, since its prerequisite (Basic Algebra) is covered.
        expect(result.props.rootSkillIds).toHaveLength(1);
        expect(result.props.rootSkillIds[0]).toBe(skill2.state.id);
    });

    it('should return the full tree if skill A has no prerequisites in common', async () => {
        // Gap between Calc II (B) and Linear Algebra (A) should be Calc I and Calc II.
        // Basic Algebra is a prereq for both, so it shouldn't be in the gap.
        const input = { skillAId: skill3.state.id, skillBId: skill4.state.id };
        const result = await gapAnalysisUseCase(input);

        expect(result.props.skills).toHaveLength(2); // Calc I and Calc II
        const skillNames = result.props.skills.map(s => s.name);
        expect(skillNames).toContain('Calculus I');
        expect(skillNames).toContain('Calculus II');

        expect(result.props.rootSkillIds).toHaveLength(1);
        expect(result.props.rootSkillIds[0]).toBe(skill2.state.id);
    });

    it('should throw an error if a skill is not found', async () => {
        const invalidId = '00000000-0000-0000-0000-000000000000';
        const input = { skillAId: skill1.state.id, skillBId: invalidId };

        await expect(gapAnalysisUseCase(input)).rejects.toThrow("One or both skills not found.");
    });
});
