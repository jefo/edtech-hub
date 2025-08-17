import { compose } from './composition-root';
import { seedSkills } from './infrastructure/in-memory/seed';
import { scaffoldUseCase } from './application/use-cases/scaffold.use-case';
import { SkillProps } from './domain/skill/skill.aggregate';

async function main() {
    // 1. Set up the application's dependencies and seed the data
    compose();
    const skills = await seedSkills();

    // 2. Define the paths we want to compare
    const genericPathInput = {
        startSkillId: skills.anemicModel.state.id,
        endSkillId: skills.eventualConsistency.state.id,
    };
    const idealPathInput = {
        startSkillId: skills.anemicModel.state.id,
        endSkillId: skills.richDomainModel.state.id,
    };

    console.log('--- Validating Learning Path ---');
    console.log(`Generic Path: From '${skills.anemicModel.state.name}' to '${skills.eventualConsistency.state.name}'`);
    console.log(`Ideal Path for this user: From '${skills.anemicModel.state.name}' to '${skills.richDomainModel.state.name}'`);
    console.log('----------------------------------\n');

    // 3. Generate both skill trees using the scaffold use case
    const genericPath = await scaffoldUseCase(genericPathInput);
    const idealPath = await scaffoldUseCase(idealPathInput);

    // 4. Find the difference: skills that are in the generic path but not in the ideal one.
    const idealSkillIds = new Set(idealPath.props.skills.map(s => s.id));
    
    const unnecessarySkills = genericPath.props.skills.filter(skill => 
        !idealSkillIds.has(skill.id)
    );

    // 5. Display the results
    if (unnecessarySkills.length === 0) {
        console.log('The generic path is already optimal for this user.');
    } else {
        console.log('The following skills from the generic path are NOT essential for this specific transformation:');
        unnecessarySkills.forEach(skill => {
            console.log(`- ${skill.name}`);
        });
    }
}

main().catch(console.error);
