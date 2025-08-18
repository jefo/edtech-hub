import { z } from 'zod';
import { createValueObject } from '@sota/core/value-object';

const TransformationSchema = z.object({
  skillId: z.string().uuid(),
  fromLevel: z.number().min(0).max(3),
  toLevel: z.number().min(1).max(4),
});

export const Transformation = createValueObject(TransformationSchema);

export type Transformation = InstanceType<typeof Transformation>;
export type TransformationProps = z.infer<typeof TransformationSchema>;
