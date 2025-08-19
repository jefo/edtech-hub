import { createPort } from '@sota/core/di';
import { DddAggregate } from './entities/aggregate.entity';
import { DddEntity } from './entities/entity.entity';
import { DddValueObject } from './entities/value-object.entity';

// Ports for saving each type of DDD concept
export const saveDddAggregatePort = createPort<(entity: DddAggregate) => Promise<void>>();
export const saveDddEntityPort = createPort<(entity: DddEntity) => Promise<void>>();
export const saveDddValueObjectPort = createPort<(entity: DddValueObject) => Promise<void>>();

// Ports for finding concepts (optional, for verification)
export const findDddAggregateByNamePort = createPort<(name: string) => Promise<DddAggregate | null>>();
