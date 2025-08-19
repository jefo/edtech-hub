import { DddAggregate } from '../../domain/entities/aggregate.entity';
import { DddEntity } from '../../domain/entities/entity.entity';
import { DddValueObject } from '../../domain/entities/value-object.entity';

const aggregates = new Map<string, DddAggregate>();
const entities = new Map<string, DddEntity>();
const valueObjects = new Map<string, DddValueObject>();

export const inMemoryDddAdapter = {
    saveDddAggregate: async (entity: DddAggregate) => { aggregates.set(entity.id, entity); },
    saveDddEntity: async (entity: DddEntity) => { entities.set(entity.id, entity); },
    saveDddValueObject: async (entity: DddValueObject) => { valueObjects.set(entity.id, entity); },

    findDddAggregateByName: async (name: string): Promise<DddAggregate | null> => {
        for (const agg of aggregates.values()) {
            if (agg.state.name === name) {
                return agg;
            }
        }
        return null;
    },
};