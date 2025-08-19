import { createBrandedId } from '@sota/core/branded-id';

export const RuntimeId = createBrandedId('RuntimeId');
export type RuntimeId = InstanceType<typeof RuntimeId>;
