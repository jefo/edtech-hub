import { z } from 'zod';
import { createEntity } from '@sota/core/entity';
import { TransformationProps } from './transformation.vo';

const ModulePropsSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    transformations: z.array(z.custom<TransformationProps>()),
});

export const Module = createEntity({
    schema: ModulePropsSchema,
    actions: {},
});

export type Module = InstanceType<typeof Module>;
export type ModuleProps = z.infer<typeof ModulePropsSchema>;
