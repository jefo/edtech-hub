import { setPortAdapter } from '@sota/core/di';
import * as ports from './domain/ports';
import { inMemoryDddAdapter } from './infrastructure/in-memory/ddd.adapter';

export const composeDdd = () => {
    setPortAdapter(ports.saveDddAggregatePort, inMemoryDddAdapter.saveDddAggregate);
    setPortAdapter(ports.saveDddEntityPort, inMemoryDddAdapter.saveDddEntity);
    setPortAdapter(ports.saveDddValueObjectPort, inMemoryDddAdapter.saveDddValueObject);
    setPortAdapter(ports.findDddAggregateByNamePort, inMemoryDddAdapter.findDddAggregateByName);
    console.log('[DDD] Composition root configured.');
};