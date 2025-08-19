import { createBrandedId } from '@sota/core/branded-id';

export const FrameworkId = createBrandedId('FrameworkId');
export type FrameworkId = InstanceType<typeof FrameworkId>;
