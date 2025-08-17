import { Skill } from '@lms/domain/skill/skill.aggregate';
import { saveSkillPort } from '@lms/domain/skill/ports';
import { usePort } from '@sota/core/di';

// Helper to reduce boilerplate
const createAndSaveSkill = async (saveFn: (skill: Skill) => Promise<void>, props: Omit<Parameters<typeof Skill.create>[0], 'id'>) => {
    const id = crypto.randomUUID();
    const skill = Skill.create({ id, ...props });
    await saveFn(skill);
    return skill;
};

export const seedSkills = async () => {
    const saveSkill = usePort(saveSkillPort);

    console.log('Seeding knowledge graph for Backend Developer...');

    // 1. Starting Point Skills
    const anemicModel = await createAndSaveSkill(saveSkill, { name: 'Anemic Models', description: 'Understanding of simple data classes (POJOs/DTOs) with no logic.' });
    const serviceLayer = await createAndSaveSkill(saveSkill, { name: 'Service Layers', description: 'Business logic is placed in stateless service classes.', prerequisiteSkillIds: [anemicModel.state.id] });

    // 2. Core DDD Concepts (The Gap)
    const ubiquitousLanguage = await createAndSaveSkill(saveSkill, { name: 'Ubiquitous Language', description: 'Developing a shared language between developers and domain experts.' });
    const valueObjects = await createAndSaveSkill(saveSkill, { name: 'Value Objects', description: 'Modeling immutable concepts defined by their attributes.', prerequisiteSkillIds: [anemicModel.state.id, ubiquitousLanguage.state.id] });
    const entities = await createAndSaveSkill(saveSkill, { name: 'Entities', description: 'Modeling concepts with a unique, continuous identity.', prerequisiteSkillIds: [anemicModel.state.id, ubiquitousLanguage.state.id] });
    const aggregates = await createAndSaveSkill(saveSkill, { name: 'Aggregates', description: 'Forming a transactional consistency boundary around a cluster of objects.', prerequisiteSkillIds: [valueObjects.state.id, entities.state.id] });
    const richDomainModel = await createAndSaveSkill(saveSkill, { name: 'Rich Domain Models', description: 'Encapsulating business logic within the domain objects themselves.', prerequisiteSkillIds: [aggregates.state.id] });

    // 3. Hexagonal Architecture
    const portsAndAdapters = await createAndSaveSkill(saveSkill, { name: 'Ports & Adapters', description: 'Decoupling the application core from infrastructure concerns.', prerequisiteSkillIds: [serviceLayer.state.id, richDomainModel.state.id] });

    // 4. Advanced Concepts & Trade-offs
    const performanceVsConsistency = await createAndSaveSkill(saveSkill, { name: 'Performance vs. Consistency Trade-off', description: 'Understanding the cost of large, strongly consistent aggregates.', prerequisiteSkillIds: [aggregates.state.id] });
    const cqrs = await createAndSaveSkill(saveSkill, { name: 'CQRS', description: 'Segregating read and write operations to optimize both.', prerequisiteSkillIds: [performanceVsConsistency.state.id, portsAndAdapters.state.id] });
    const domainEvents = await createAndSaveSkill(saveSkill, { name: 'Domain Events', description: 'Communicating between aggregates without creating direct coupling.', prerequisiteSkillIds: [aggregates.state.id] });
    const eventualConsistency = await createAndSaveSkill(saveSkill, { name: 'Eventual Consistency', description: 'Accepting that read models may have a slight delay in updating.', prerequisiteSkillIds: [cqrs.state.id, domainEvents.state.id] });

    console.log('Seeding complete!');
    
    return {
        anemicModel,
        richDomainModel,
        eventualConsistency
    };
};