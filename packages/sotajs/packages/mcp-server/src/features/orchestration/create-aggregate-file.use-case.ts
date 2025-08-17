import { z } from 'zod';
import { withValidation } from '@sota/core/validation';
import { usePort } from '@sota/core/di';
import { writeFilePort } from '../filesystem/ports';

const CreateAggregateFileInputSchema = z.object({
  featureName: z.string(),
  aggregateName: z.string(),
  properties: z.record(z.string()), // e.g., { id: 'uuid', email: 'string' }
});

// Helper to generate Zod schema properties from the input object
function generateZodSchema(properties: Record<string, string>): string {
  return Object.entries(properties)
    .map(([key, type]) => {
      let zodType = 'z.string()'; // default
      if (type === 'uuid') {
        zodType = 'z.string().uuid()';
      } else if (type === 'number') {
        zodType = 'z.number()';
      } else if (type === 'boolean') {
        zodType = 'z.boolean()';
      }
      return `  ${key}: ${zodType},`;
    })
    .join('\n');
}

// Helper to generate class getters
function generateGetters(properties: Record<string, string>): string {
  return Object.entries(properties)
    .map(([key, type]) => `  get ${key}(): ${type === 'uuid' ? 'string' : type} { return this.props.${key}; }`)
    .join('\n');
}

async function handleCreateAggregateFile(input: z.infer<typeof CreateAggregateFileInputSchema>) {
  const { featureName, aggregateName, properties } = input;
  const writeFile = usePort(writeFilePort);

  const aggregateNameLower = aggregateName.toLowerCase();

  const fileContent = `
import { z } from 'zod';

const ${aggregateName}PropsSchema = z.object({
${generateZodSchema(properties)}
});

type ${aggregateName}Props = z.infer<typeof ${aggregateName}PropsSchema>;

export class ${aggregateName} {
  private readonly props: ${aggregateName}Props;

  private constructor(props: ${aggregateName}Props) {
    this.props = props;
  }

${generateGetters(properties)}

  get state(): Readonly<${aggregateName}Props> {
    return this.props;
  }

  public static create(data: Omit<${aggregateName}Props, 'id'>): ${aggregateName} {
    const props = ${aggregateName}PropsSchema.parse({
      id: crypto.randomUUID(),
      ...data,
    });
    return new ${aggregateName}(props);
  }
}
`;

  const filePath = `lib/${featureName}/domain/${aggregateNameLower}.aggregate.ts`;

  await writeFile(filePath, fileContent);

  return { success: true, filePath };
}

export const createAggregateFileUseCase = withValidation(
  handleCreateAggregateFile,
  CreateAggregateFileInputSchema
);
