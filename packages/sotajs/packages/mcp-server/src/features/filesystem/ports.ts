import { createPort } from '@sota/core/di';

// This port defines the contract for a function that can list files.
// The Use Case will depend on this abstraction, not a concrete implementation.
export const listFilesPort = createPort<(path: string) => Promise<string[]>>();

// Port for writing a file to the filesystem.
export const writeFilePort = createPort<(
  path: string, 
  content: string
) => Promise<void>>();
