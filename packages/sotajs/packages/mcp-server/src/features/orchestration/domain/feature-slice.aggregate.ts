import { z } from 'zod';

// --- Value Objects for the FeatureSlice Aggregate ---

const UseCaseContractSchema = z.object({
  name: z.string(),
  inputDto: z.string(),
  outputDto: z.string(),
  ports: z.array(z.string()),
}).optional();

const AggregateDefinitionSchema = z.object({
  name: z.string(),
  properties: z.record(z.string()),
}).optional();

// --- Main Aggregate Schema ---

const FeatureSlicePropsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(['design', 'implemented', 'tested']).default('design'),
  useCase: UseCaseContractSchema,
  aggregate: AggregateDefinitionSchema,
});

type FeatureSliceProps = z.infer<typeof FeatureSlicePropsSchema>;

// --- The FeatureSlice Aggregate Class ---

export class FeatureSlice {
  private readonly props: FeatureSliceProps;

  private constructor(props: FeatureSliceProps) {
    this.props = props;
  }

  // --- Getters ---
  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get state() { return this.props; }

  // --- Factory Method ---
  public static create(data: { name: string }): FeatureSlice {
    const props = FeatureSlicePropsSchema.parse({
      id: crypto.randomUUID(),
      name: data.name,
    });
    return new FeatureSlice(props);
  }

  // --- Business Logic Methods (Actions) ---

  public defineUseCaseContract(contract: z.infer<typeof UseCaseContractSchema>) {
    // In a real implementation, we would have invariants here.
    // For example, check for valid DTO syntax, etc.
    this.props.useCase = contract;
    console.log(`[FeatureSlice] Use case contract for '${this.name}' defined.`);
  }

  public defineAggregate(definition: z.infer<typeof AggregateDefinitionSchema>) {
    // Invariant: Cannot define aggregate if use case is not defined yet.
    if (!this.props.useCase) {
      throw new Error('Cannot define aggregate before the use case contract is set.');
    }
    // Invariant: Check if aggregate properties are consistent with use case DTOs.
    // (This is a simplified check)
    console.log(`[FeatureSlice] Aggregate '${definition?.name}' for '${this.name}' defined.`);
    this.props.aggregate = definition;
    this.props.status = 'implemented'; // Mark as ready for generation
  }
}
}
