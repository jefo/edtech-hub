import { z } from 'zod';
import { withValidation } from '@sota/core/validation';
import { usePort } from '@sota/core/di';
import { FeatureSlice } from '../domain/feature-slice.aggregate';
import { saveFeatureSlicePort } from '../domain/ports';

const CreateFeatureSliceInputSchema = z.object({
  name: z.string().min(3, 'Feature name must be at least 3 characters long'),
});

async function handleCreateFeatureSlice(input: z.infer<typeof CreateFeatureSliceInputSchema>) {
  const saveFeatureSlice = usePort(saveFeatureSlicePort);

  // 1. Create the new aggregate instance.
  const newSlice = FeatureSlice.create(input);

  // 2. Persist it using the port.
  await saveFeatureSlice(newSlice);

  // 3. Return the ID of the new resource.
  return { featureSliceId: newSlice.id };
}

export const createFeatureSliceUseCase = withValidation(
  handleCreateFeatureSlice,
  CreateFeatureSliceInputSchema
);
