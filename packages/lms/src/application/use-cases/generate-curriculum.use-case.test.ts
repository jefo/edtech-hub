import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { resetDI, setPortAdapter } from '@sota/core/di';
import { SkillTree } from '@lms/domain/skill/skill-tree.vo';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { Curriculum } from '@lms/domain/curriculum/curriculum.aggregate';
import { Module } from '@lms/domain/curriculum/module.entity';
import { Lesson } from '@lms/domain/curriculum/lesson.entity';
import { saveCurriculumPort, saveModulePort, saveLessonPort } from '@lms/domain/curriculum/ports';
import { generateCurriculumUseCase } from './generate-curriculum.use-case';

// Mocks for the save ports
const mockSaveCurriculum = mock(async (c: Curriculum) => {});
const mockSaveModule = mock(async (m: Module) => {});
const mockSaveLesson = mock(async (l: Lesson) => {});

describe('generateCurriculumUseCase', () => {
    beforeEach(() => {
        resetDI();
        mockSaveCurriculum.mockClear();
        mockSaveModule.mockClear();
        mockSaveLesson.mockClear();

        setPortAdapter(saveCurriculumPort, mockSaveCurriculum);
        setPortAdapter(saveModulePort, mockSaveModule);
        setPortAdapter(saveLessonPort, mockSaveLesson);
    });

    it('should generate a curriculum from a skill tree', async () => {
        // 1. Arrange: Create a sample skill tree
        const skill1 = Skill.create({ id: 'c5b2c6f8-9497-4f00-916a-8a1709a6a8ea', name: 'Basic Algebra', prerequisiteSkillIds: [] });
        const skill2 = Skill.create({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Calculus I', prerequisiteSkillIds: [skill1.state.id] });
        const skillTree = SkillTree.create({
            skills: [skill1.state, skill2.state],
            rootSkillIds: [skill1.state.id],
        });

        const input = {
            title: 'Intro to Calculus',
            skillTree: skillTree,
        };

        // 2. Act: Run the use case
        const result = await generateCurriculumUseCase(input);

        // 3. Assert
        expect(result.curriculumId).toBeString();
        expect(result.moduleCount).toBe(2);
        expect(result.lessonCount).toBe(2);

        // Check if save functions were called
        expect(mockSaveLesson).toHaveBeenCalledTimes(2);
        expect(mockSaveModule).toHaveBeenCalledTimes(2);
        expect(mockSaveCurriculum).toHaveBeenCalledTimes(1);

        // Inspect the created curriculum
        const savedCurriculum = mockSaveCurriculum.mock.calls[0][0];
        expect(savedCurriculum.state.title).toBe('Intro to Calculus');
        expect(savedCurriculum.state.moduleIds).toHaveLength(2);

        // Inspect one of the lessons
        const savedLesson = mockSaveLesson.mock.calls[0][0];
        expect(savedLesson.state.title).toBe('Урок: Basic Algebra');
        expect(savedLesson.state.skillId).toBe(skill1.state.id);
    });
    
    it('should throw an error for an empty skill tree', async () => {
        const emptySkillTree = SkillTree.create({ skills: [], rootSkillIds: [] });
        const input = { title: 'Empty Course', skillTree: emptySkillTree };

        await expect(generateCurriculumUseCase(input)).rejects.toThrow("Cannot create an empty curriculum. The skill tree must contain skills.");
    });
});
