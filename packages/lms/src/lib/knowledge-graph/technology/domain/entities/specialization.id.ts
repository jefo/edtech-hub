import { createBrandedId } from '@sota/core/branded-id';

export const SpecializationId = createBrandedId('SpecializationId');
export type SpecializationId = InstanceType<typeof SpecializationId>;
