import { usePort } from '@sota/core/di';
import {
    saveDddAggregatePort,
    saveDddEntityPort,
    saveDddValueObjectPort
} from '../../domain/ports';
import { DddAggregate } from '../../domain/entities/aggregate.entity';
import { DddEntity } from '../../domain/entities/entity.entity';
import { DddValueObject } from '../../domain/entities/value-object.entity';

export const seedDdd = async () => {
    console.log('Seeding DDD Knowledge Context...');

    const saveAggregate = usePort(saveDddAggregatePort);
    const saveEntity = usePort(saveDddEntityPort);
    const saveValueObject = usePort(saveDddValueObjectPort);

    // 1. Create the atomic concepts first
    const entityConcept = DddEntity.create({
        id: crypto.randomUUID(),
        name: 'Entity',
        description: 'An object with a distinct identity that persists over time.'
    });
    const voConcept = DddValueObject.create({
        id: crypto.randomUUID(),
        name: 'Value Object',
        description: 'An immutable object defined by its attributes, like Money or Address.'
    });

    await saveEntity(entityConcept);
    await saveValueObject(voConcept);

    // 2. Create the composite concept (Aggregate)
    const aggregateConcept = DddAggregate.create({
        id: crypto.randomUUID(),
        name: 'Aggregate',
        description: 'A cluster of associated objects that we treat as a single unit for data changes.',
        entityIds: [entityConcept.id],
        valueObjectIds: [voConcept.id],
    });

    await saveAggregate(aggregateConcept);

    console.log('DDD Knowledge Context seeding complete!');
};