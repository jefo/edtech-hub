import { z } from 'zod';
import { withValidation } from '@sota/core/validation';
import { usePort } from '@sota/core/di';
import { findFeatureSliceByIdPort, saveFeatureSlicePort } from '../domain/ports';

const DefineAggregateInputSchema = z.object({
  featureSliceId: z.string().uuid(),
  aggregateName: z.string(),
  properties: z.record(z.string()),
});

async function handleDefineAggregate(input: z.infer<typeof DefineAggregateInputSchema>) {
  const findFeatureSliceById = usePort(findFeatureSliceByIdPort);
  const saveFeatureSlice = usePort(saveFeatureSlicePort);

  const { featureSliceId, ...definition } = input;

  // 1. Load the aggregate
  const slice = await findFeatureSliceById(featureSliceId);
  if (!slice) {
    throw new Error(`FeatureSlice with ID ${featureSliceId} not found.`);
  }

  // 2. Call the aggregate's method to update its state
  slice.defineAggregate(definition);

  // 3. Persist the updated aggregate
  await saveFeatureSlice(slice);

  return { success: true, featureSliceId };
}

export const defineAggregateUseCase = withValidation(
  handleDefineAggregate,
  DefineAggregateInputSchema
);
