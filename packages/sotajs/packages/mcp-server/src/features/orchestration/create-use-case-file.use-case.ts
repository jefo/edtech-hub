import { z } from 'zod';
import { withValidation } from '../../../lib/validation';
import { usePort } from '@sota/core/di';
import { writeFilePort } from '../filesystem/ports';

// Schema for the input of our code generation UseCase.
// This matches the MCP Tool definition.
const CreateUseCaseFileInputSchema = z.object({
  featureName: z.string(),
  useCaseName: z.string(),
  inputDto: z.string(),
  outputDto: z.string(),
  ports: z.array(z.string()),
});

// The handler function that generates the code.
async function handleCreateUseCaseFile(input: z.infer<typeof CreateUseCaseFileInputSchema>) {
  const { featureName, useCaseName, inputDto, outputDto, ports } = input;

  const writeFile = usePort(writeFilePort);

  // Helper to format port imports and usage
  const portImports = ports.map(p => `${p}Port`).join(', ');
  const portUsage = ports.map(p => `const ${p} = usePort(${p}Port);`).join('\n  ');

  // Template for the new use case file
  const fileContent = `
import { z } from 'zod';
import { withValidation } from '@sota/core/validation';
import { usePort } from '@sota/core/di';
import { ${portImports} } from '../domain/ports'; // Assuming ports are in ../domain/ports

const ${useCaseName}InputSchema = ${inputDto};

type ${useCaseName}Output = ${outputDto};

async function handle${useCaseName}(input: z.infer<typeof ${useCaseName}InputSchema>): Promise<${useCaseName}Output> {
  // Setup port access
  ${portUsage}

  // TODO: Implement business logic
  console.log('Executing ${useCaseName} with input:', input);
  throw new Error('Not implemented');
}

export const ${useCaseName}UseCase = withValidation(
  handle${useCaseName},
  ${useCaseName}InputSchema
);
`;

  const filePath = `lib/${featureName}/use-cases/${useCaseName}.use-case.ts`;

  await writeFile(filePath, fileContent);

  return { success: true, filePath };
}

// Export the final, validated use case for code generation
export const createUseCaseFileUseCase = withValidation(
  handleCreateUseCaseFile,
  CreateUseCaseFileInputSchema
);
