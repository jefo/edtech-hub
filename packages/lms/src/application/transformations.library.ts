import { Competency, CompetencyProps } from '@lms/domain/competency/competency.vo';
import { SeededSkills } from '../infrastructure/in-memory/seed';

export interface TransformationDefinition {
    name: string;
    description: string;
    targetCompetencies: CompetencyProps[];
}

export const getTransformationLibrary = (skills: SeededSkills): Record<string, TransformationDefinition> => ({
    'adopt-ddd': {
        name: 'Adopt Domain-Driven Design',
        description: 'Transition from anemic models to using rich domain models and aggregates.',
        targetCompetencies: [
            Competency.create({ skillId: skills.richDomainModel.state.id, level: 2 }).props,
        ],
    },
    'become-contributor': {
        name: 'Become a Contributor',
        description: 'Master advanced architectural patterns to contribute to complex systems.',
        targetCompetencies: [
            Competency.create({ skillId: skills.richDomainModel.state.id, level: 3 }).props,
            Competency.create({ skillId: skills.cqrs.state.id, level: 2 }).props,
            Competency.create({ skillId: skills.eventualConsistency.state.id, level: 2 }).props,
        ],
    }
});

// We also need to export the type of the seeded skills for type safety elsewhere
export type SeededSkills = Awaited<ReturnType<typeof import('../infrastructure/in-memory/seed').seedSkills>>;
