import { compose } from './composition-root';
import { seedSkills } from './infrastructure/in-memory/seed';
import { scaffoldUseCase } from './application/use-cases/scaffold.use-case';
import { inMemorySkillAdapter } from './infrastructure/in-memory/skill.adapter';

async function main() {
    // 1. Set up the application's dependencies (DI container)
    compose();

    // 2. Seed the in-memory database with our skill graph
    const { anemicModel, eventualConsistency } = await seedSkills();

    console.log('\n-------------------\n');
    console.log('Running scaffold from "Anemic Models" to "Eventual Consistency"...');

    // 3. Run the scaffold use case to find the learning path
    const learningPath = await scaffoldUseCase({
        startSkillId: anemicModel.state.id,
        endSkillId: eventualConsistency.state.id,
    });

    // 4. Display the results in a readable format
    console.log('\nYour Learning Path (Scaffold):');
    const allSkills = await inMemorySkillAdapter.getAllSkills();
    const allSkillsMap = new Map(allSkills.map(s => [s.state.id, s.state]));

    const printTree = (skillId: string, indent = '') => {
        const skill = allSkillsMap.get(skillId);
        if (!skill) return;

        console.log(`${indent}- ${skill.name}`);
        
        const children = learningPath.props.skills
            .filter(s => s.prerequisiteSkillIds.includes(skillId))
            .map(s => s.id);

        children.forEach(childId => printTree(childId, indent + '  '));
    };

    learningPath.props.rootSkillIds.forEach(rootId => printTree(rootId));
    console.log('\n-------------------\n');
}

main().catch(console.error);
