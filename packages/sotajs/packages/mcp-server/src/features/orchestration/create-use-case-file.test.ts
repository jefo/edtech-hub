import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { resetDI, setPortAdapter } from '@sota/core/di';
import { createUseCaseFileUseCase } from './create-use-case-file.use-case';
import { writeFilePort } from '../filesystem/ports';

// Mock implementation of the writeFilePort
const mockWriteFile = mock((path: string, content: string) => {
  console.log(`[Mock WriteFilePort] Called with path: ${path}`);
  // In a real test, we might not even log the content unless debugging
  // console.log(`[Mock WriteFilePort] Content:\n${content}`);
  return Promise.resolve();
});

describe('createUseCaseFileUseCase', () => {

  beforeEach(() => {
    // Reset the DI container and the mock before each test for isolation
    resetDI();
    mockWriteFile.mockClear();
    // Bind the port to our mock implementation
    setPortAdapter(writeFilePort, mockWriteFile);
  });

  it('should generate use case file content and call the writeFilePort with correct parameters', async () => {
    // 1. Arrange: Define the input contract for the new use case
    const useCaseContract = {
      featureName: 'users',
      useCaseName: 'createUser',
      inputDto: `z.object({ email: z.string().email(), password: z.string().min(8) })`,
      outputDto: `{ userId: string }`,
      ports: ['findUserByEmail', 'saveUser'],
    };

    // 2. Act: Execute the use case we are testing
    await createUseCaseFileUseCase(useCaseContract);

    // 3. Assert: Verify that our mock dependency was called correctly
    
    // It should be called exactly once
    expect(mockWriteFile).toHaveBeenCalledTimes(1);

    // It should be called with the correct file path
    const expectedFilePath = 'lib/users/use-cases/createUser.use-case.ts';
    const actualFilePath = mockWriteFile.mock.calls[0][0];
    expect(actualFilePath).toBe(expectedFilePath);

    // We can even check if the generated content is correct
    const actualFileContent = mockWriteFile.mock.calls[0][1];
    expect(actualFileContent).toContain('export const createUserUseCase = withValidation');
    expect(actualFileContent).toContain('const findUserByEmail = usePort(findUserByEmailPort);');
    expect(actualFileContent).toContain('const saveUser = usePort(saveUserPort);');
  });
});
