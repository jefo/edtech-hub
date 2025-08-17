import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { resetDI, setPortAdapter } from '@sota/core/di';
import { createFeatureSliceUseCase } from './use-cases/create-feature-slice.use-case';
import { defineUseCaseContractUseCase } from './use-cases/define-use-case-contract.use-case';
import { defineAggregateUseCase } from './use-cases/define-aggregate.use-case';
import { generateCodeForFeatureSliceUseCase } from './use-cases/generate-code-for-feature-slice.use-case';
import { writeFilePort } from '../filesystem/ports'; // Assuming listFilesPort is not used in this e2e test
import { saveFeatureSlicePort, findFeatureSliceByIdPort } from './domain/ports';
import { FeatureSlice } from './domain/feature-slice.aggregate';

// --- Mocks for Infrastructure Ports ---

// Mock for writeFilePort: captures calls and allows snapshot testing
const mockWriteFile = mock((path: string, content: string) => {
  console.log(`[Mock WriteFilePort] Called with path: ${path}`);
  // We don't actually write, just capture for snapshot
  return Promise.resolve();
});

// In-Memory Persistence for FeatureSlices (as in main.ts)
const featureSlices = new Map<string, FeatureSlice>();
const mockSaveFeatureSlice = mock(async (slice: FeatureSlice) => {
  featureSlices.set(slice.id, slice);
  return Promise.resolve();
});
const mockFindFeatureSliceById = mock(async (id: string) => {
  return featureSlices.get(id) || null;
});

describe('Feature Slice Orchestration E2E', () => {

  beforeEach(() => {
    // Reset DI and mocks for each test
    resetDI();
    mockWriteFile.mockClear();
    mockSaveFeatureSlice.mockClear();
    mockFindFeatureSliceById.mockClear();
    featureSlices.clear(); // Clear in-memory store

    // Bind all necessary ports to their mock implementations
    setPortAdapter(writeFilePort, mockWriteFile);
    setPortAdapter(saveFeatureSlicePort, mockSaveFeatureSlice);
    setPortAdapter(findFeatureSliceByIdPort, mockFindFeatureSliceById);
    // listFilesPort is not used in this specific e2e flow, so no need to mock it here
  });

  it('should orchestrate the creation of a complete feature slice and generate the code using ts-morph', async () => {
    // --- 1. Create Feature Slice ---
    const createSliceInput = { name: 'UserRegistration' };
    const createSliceResult = await createFeatureSliceUseCase(createSliceInput);
    const featureSliceId = createSliceResult.featureSliceId;

    expect(featureSliceId).toBeString();
    expect(mockSaveFeatureSlice).toHaveBeenCalledTimes(1);
    expect(mockFindFeatureSliceById).toHaveBeenCalledTimes(0); // Not called yet

    // --- 2. Define Use Case Contract ---
    const defineUseCaseInput = {
      featureSliceId,
      useCaseName: 'registerUser',
      inputDto: `z.object({ email: z.string().email(), password: z.string().min(8) })`,
      outputDto: `{ userId: string }`,
      ports: ['findUserByEmail', 'saveUser'],
    };
    await defineUseCaseContractUseCase(defineUseCaseInput);

    expect(mockFindFeatureSliceById).toHaveBeenCalledTimes(1); // Called to load slice
    expect(mockSaveFeatureSlice).toHaveBeenCalledTimes(2); // Called to save updated slice

    // --- 3. Define Aggregate ---
    const defineAggregateInput = {
      featureSliceId,
      aggregateName: 'User',
      properties: { id: 'uuid', email: 'string', passwordHash: 'string' },
    };
    await defineAggregateUseCase(defineAggregateInput);

    expect(mockFindFeatureSliceById).toHaveBeenCalledTimes(2); // Called to load slice again
    expect(mockSaveFeatureSlice).toHaveBeenCalledTimes(3); // Called to save updated slice again

    // --- 4. Generate Code ---
    await generateCodeForFeatureSliceUseCase({ featureSliceId });

    // Assertions for generated files
    expect(mockWriteFile).toHaveBeenCalledTimes(2); // Expecting 2 files: aggregate and use case

    // Get the calls to writeFilePort
    const aggregateFileCall = mockWriteFile.mock.calls.find(call => call[0].includes('user.aggregate.ts'));
    const useCaseFileCall = mockWriteFile.mock.calls.find(call => call[0].includes('registerUser.use-case.ts'));

    expect(aggregateFileCall).toBeDefined();
    expect(useCaseFileCall).toBeDefined();

    // Snapshot test the content of the generated files
    expect(aggregateFileCall[1]).toMatchSnapshot();
    expect(useCaseFileCall[1]).toMatchSnapshot();
  });
});
