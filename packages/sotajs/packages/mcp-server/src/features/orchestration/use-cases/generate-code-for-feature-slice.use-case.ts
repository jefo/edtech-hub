import { z } from 'zod';
import { withValidation } from '@sota/core/validation';
import { usePort } from '@sota/core/di';
import { findFeatureSliceByIdPort, renderFeatureSlicePort } from '../domain/ports';

const GenerateCodeInputSchema = z.object({
  featureSliceId: z.string().uuid(),
});

async function handleGenerateCodeForFeatureSlice(input: z.infer<typeof GenerateCodeInputSchema>) {
  const findFeatureSliceById = usePort(findFeatureSliceByIdPort);
  const renderFeatureSlice = usePort(renderFeatureSlicePort);

  const { featureSliceId } = input;

  // 1. Load the aggregate
  const slice = await findFeatureSliceById(featureSliceId);
  if (!slice) {
    throw new Error(`FeatureSlice with ID ${featureSliceId} not found.`);
  }

  // 2. Delegate the entire code generation process to the infrastructure port.
  const generatedFiles = await renderFeatureSlice(slice);

  return { 
    success: true, 
    generatedFiles: generatedFiles.map(f => f.filePath)
  };
}

export const generateCodeForFeatureSliceUseCase = withValidation(
  handleGenerateCodeForFeatureSlice,
  GenerateCodeInputSchema
);
