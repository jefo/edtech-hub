import { createBrandedId } from '@sota/core/branded-id';

export const DddAggregateId = createBrandedId('DddAggregateId');
export type DddAggregateId = InstanceType<typeof DddAggregateId>;
