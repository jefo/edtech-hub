import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { resetDI, setPortAdapter } from '@sota/core/di';
import { findSkillByIdPort, findSkillsByIdsPort } from '@lms/domain/skill/ports';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { scaffoldUseCase } from './scaffold.use-case';
import { SkillTree } from '@lms/domain/skill/skill-tree.vo';

// Re-using the same test data and mocks from the previous test
const skillsDb = new Map<string, Skill>();

const skill1 = Skill.create({ id: 'c5b2c6f8-9497-4f00-916a-8a1709a6a8ea', name: 'Basic Algebra', prerequisiteSkillIds: [] });
const skill2 = Skill.create({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Calculus I', prerequisiteSkillIds: [skill1.state.id] });
const skill3 = Skill.create({ id: 'e8a5b5a0-5bfa-4a0e-8b0a-0e02b2c3d47a', name: 'Linear Algebra', prerequisiteSkillIds: [skill1.state.id] });
const skill4 = Skill.create({ id: 'a1b2c3d4-e5f6-4890-8234-567890abcdef', name: 'Calculus II', prerequisiteSkillIds: [skill2.state.id] });

skillsDb.set(skill1.state.id, skill1);
skillsDb.set(skill2.state.id, skill2);
skillsDb.set(skill3.state.id, skill3);
skillsDb.set(skill4.state.id, skill4);

const mockFindSkillById = mock(async ({ id }: { id: string }) => skillsDb.get(id) || null);
const mockFindSkillsByIds = mock(async ({ ids }: { ids: string[] }) => ids.map(id => skillsDb.get(id)).filter(Boolean) as Skill[]);

describe('scaffoldUseCase', () => {
    beforeEach(() => {
        resetDI();
        setPortAdapter(findSkillByIdPort, mockFindSkillById);
        setPortAdapter(findSkillsByIdsPort, mockFindSkillsByIds);
    });

    it('should return the skills between a start and end skill', async () => {
        // The scaffold between Basic Algebra (start) and Calculus II (end) should be Calculus I.
        // Calculus II is also part of the prerequisite tree of itself, so it will be included.
        const input = { startSkillId: skill1.state.id, endSkillId: skill4.state.id };
        const result = await scaffoldUseCase(input);

        expect(result).toBeInstanceOf(SkillTree);
        expect(result.props.skills).toHaveLength(2); // Calculus I and Calculus II
        
        const skillNames = result.props.skills.map(s => s.name);
        expect(skillNames).toContain('Calculus I');
        expect(skillNames).toContain('Calculus II');

        // The root of the scaffold should be Calculus I, as its prerequisite (Basic Algebra) is the start skill.
        expect(result.props.rootSkillIds).toHaveLength(1);
        expect(result.props.rootSkillIds[0]).toBe(skill2.state.id);
    });

    it('should return an empty tree if start skill is the same as end skill', async () => {
        const input = { startSkillId: skill1.state.id, endSkillId: skill1.state.id };
        const result = await scaffoldUseCase(input);
        expect(result.props.skills).toHaveLength(0);
    });

    it('should return an empty tree if end skill is a prerequisite of start skill', async () => {
        const input = { startSkillId: skill4.state.id, endSkillId: skill1.state.id };
        const result = await scaffoldUseCase(input);
        expect(result.props.skills).toHaveLength(0);
    });
});
