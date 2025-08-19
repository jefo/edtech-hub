import { compose } from './composition-root';
import { seedSkills } from './infrastructure/in-memory/seed';
import { createCurriculumUseCase } from './application/use-cases/create-curriculum.use-case';
import { LearnerProfile } from './domain/learner/learner-profile.aggregate';
import { usePort } from '@sota/core/di';
import { saveLearnerProfilePort } from './domain/learner/ports';
import { Competency } from './domain/competency/competency.vo';
import { findCurriculumByIdPort } from './domain/curriculum/ports';
import { inMemorySkillAdapter } from './infrastructure/in-memory/skill.adapter';
import { Curriculum } from './domain/curriculum/curriculum.aggregate';

async function printCurriculum(curriculumId: string) {
    const findCurriculumById = usePort(findCurriculumByIdPort);
    const curriculum = await findCurriculumById({ id: curriculumId });
    if (!curriculum) {
        console.error('Could not find curriculum to print.');
        return;
    }

    const allSkills = await inMemorySkillAdapter.getAllSkills();
    const skillsMap = new Map(allSkills.map(s => [s.state.id, s]));

    for (const module of curriculum.state.modules) {
        console.log(`
  [${module.name}]`);
        for (const lesson of module.lessons) {
            const skill = skillsMap.get(lesson.transformation.skillId);
            if (skill) {
                console.log(`  - Урок: ${lesson.name}`);
                lesson.learningObjectives.forEach(objective => {
                    console.log(`    - Цель: ${objective.description}`);
                });
            }
        }
    }
}

async function main() {
    // 1. Set up dependencies and seed the skill graph
    compose();
    const skills = await seedSkills();
    const saveLearnerProfile = usePort(saveLearnerProfilePort);

    // 2. Create a sample learner profile
    const learner = LearnerProfile.create({
        id: crypto.randomUUID(),
        competencies: [
            Competency.create({ skillId: skills.anemicModel.state.id, level: 1 }).props
        ]
    });
    await saveLearnerProfile(learner);

    // 3. Define a target for the learner
    const targetCompetencies = [
        Competency.create({ skillId: skills.richDomainModel.state.id, level: 2 }).props
    ];

    console.log('=================================================================');
    console.log(`GENERATING CURRICULUM FOR LEARNER: ${learner.state.id}`);
    console.log('TARGET: Rich Domain Models (Level 2)');
    console.log('=================================================================');

    // --- STRATEGY 1: TOPOLOGICAL SORT ---
    console.log('\n--- STRATEGY 1: Topological Sort (Prerequisite-First) ---');
    const result1 = await createCurriculumUseCase({
        learnerId: learner.state.id,
        targetCompetencies: targetCompetencies,
        strategyName: 'topological-sort',
    });
    if (result1) {
        await printCurriculum(result1.curriculumId);
    }

    // --- STRATEGY 2: IMMERSIVE PRACTICE ---
    console.log('\n\n--- STRATEGY 2: Immersive Practice (Theory with Practice) ---');
    const result2 = await createCurriculumUseCase({
        learnerId: learner.state.id,
        targetCompetencies: targetCompetencies,
        strategyName: 'immersive-practice',
    });
    if (result2) {
        await printCurriculum(result2.curriculumId);
    }
    console.log('\n=================================================================');
}

main().catch(console.error);