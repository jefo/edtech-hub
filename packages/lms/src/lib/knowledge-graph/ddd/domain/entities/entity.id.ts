import { createBrandedId } from '@sota/core/branded-id';

export const DddEntityId = createBrandedId('DddEntityId');
export type DddEntityId = InstanceType<typeof DddEntityId>;
