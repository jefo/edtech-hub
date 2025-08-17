import { McpServer, defineTool, stdio } from '@modelcontextprotocol/sdk';
import { createSotaMcpAdapter } from '../../packages/mcp/src/index';
import { setPortAdapter } from '@sota/core/di';
import fs from 'fs/promises';
import path from 'path';

// --- Feature Imports ---
import { listFilesUseCase } from './features/filesystem/use-case';
import { writeFilePort, listFilesPort } from './features/filesystem/ports';
import { createFeatureSliceUseCase } from './features/orchestration/use-cases/create-feature-slice.use-case';
import { saveFeatureSlicePort, findFeatureSliceByIdPort } from './features/orchestration/domain/ports';
import { FeatureSlice } from './features/orchestration/domain/feature-slice.aggregate';

import { defineUseCaseContractUseCase } from './features/orchestration/use-cases/define-use-case-contract.use-case';

import { defineAggregateUseCase } from './features/orchestration/use-cases/define-aggregate.use-case';

import { generateCodeForFeatureSliceUseCase } from './features/orchestration/use-cases/generate-code-for-feature-slice.use-case';

// --- Tool Definitions ---

const listFilesTool = defineTool({
  name: 'listFiles',
  description: 'Lists files and directories at a given path.',
  input: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The directory path to list. Defaults to current directory.',
      },
    },
  },
});

const createFeatureSliceTool = defineTool({
  name: 'createFeatureSlice',
  description: 'Creates a new feature slice to begin the orchestration process.',
  input: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The name of the new feature, e.g., \'UserRegistration\'.' },
    },
    required: ['name'],
  },
});

const defineUseCaseContractTool = defineTool({
  name: 'defineUseCaseContract',
  description: 'Defines the use case contract for an existing feature slice.',
  input: {
    type: 'object',
    properties: {
      featureSliceId: { type: 'string', description: 'The ID of the feature slice to update.' },
      useCaseName: { type: 'string', description: 'Name of the use case, e.g., \'createUser\'.' },
      inputDto: { type: 'string', description: 'A Zod schema definition for the input DTO as a string.' },
      outputDto: { type: 'string', description: 'A TypeScript type definition for the output DTO as a string.' },
      ports: { type: 'array', items: { type: 'string' }, description: 'A list of port names this use case depends on.' },
    },
    required: ['featureSliceId', 'useCaseName', 'inputDto', 'ports']
  },
});

const defineAggregateTool = defineTool({
  name: 'defineAggregate',
  description: 'Defines the domain aggregate for an existing feature slice.',
  input: {
    type: 'object',
    properties: {
      featureSliceId: { type: 'string', description: 'The ID of the feature slice to update.' },
      aggregateName: { type: 'string', description: 'Name of the aggregate, e.g., \'User\'.' },
      properties: { type: 'object', description: 'An object defining the properties of the aggregate, with types as strings (e.g., { id: \"uuid\", email: \"string\" }).' },
    },
    required: ['featureSliceId', 'aggregateName', 'properties']
  },
});

const generateCodeForFeatureSliceTool = defineTool({
  name: 'generateCodeForFeatureSlice',
  description: 'Generates all source code files for a fully defined feature slice.',
  input: {
    type: 'object',
    properties: {
      featureSliceId: { type: 'string', description: 'The ID of the feature slice to generate code for.' },
    },
    required: ['featureSliceId'],
  },
});

// TODO: Define tools for updating and generating feature slices


// --- Sota DI Configuration ---

function setupDependencies() {
  // Filesystem Adapters
  setPortAdapter(listFilesPort, (path: string) => fs.readdir(path));
  setPortAdapter(writeFilePort, async (filePath: string, content: string) => {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  });

  // In-Memory Persistence Adapter for FeatureSlices
  const featureSlices = new Map<string, FeatureSlice>();

  setPortAdapter(saveFeatureSlicePort, async (slice: FeatureSlice) => {
    console.log(`[Persistence] Saving FeatureSlice: ${slice.name} (${slice.id})`);
    featureSlices.set(slice.id, slice);
  });

  setPortAdapter(findFeatureSliceByIdPort, async (id: string) => {
    console.log(`[Persistence] Finding FeatureSlice by ID: ${id}`);
    return featureSlices.get(id) || null;
  });

  // Code Generation Adapter
  setPortAdapter(renderFeatureSlicePort, tsMorphFeatureSliceAdapter);

  // Filesystem Write Adapter (used by TsMorphFeatureSliceAdapter)
  setPortAdapter(writeFilePort, async (filePath: string, content: string) => {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`[FileSystemAdapter] Wrote file to: ${filePath}`);
  });

  // Code Generation Adapter
  setPortAdapter(renderFeatureSlicePort, tsMorphFeatureSliceAdapter);
}

// --- Server Initialization ---

function main() {
  setupDependencies();

  const server = new McpServer();

  // Register tools with their Sota UseCase handlers
  server.addTool(listFilesTool, createSotaMcpAdapter(listFilesUseCase));
  server.addTool(createFeatureSliceTool, createSotaMcpAdapter(createFeatureSliceUseCase));
  server.addTool(defineUseCaseContractTool, createSotaMcpAdapter(defineUseCaseContractUseCase));
  server.addTool(defineAggregateTool, createSotaMcpAdapter(defineAggregateUseCase));
  server.addTool(generateCodeForFeatureSliceTool, createSotaMcpAdapter(generateCodeForFeatureSliceUseCase));

  console.log('MCP Server is running. Registered tools: listFiles, createFeatureSlice, defineUseCaseContract, defineAggregate, generateCodeForFeatureSlice');
  console.log('Waiting for input via stdio...');
  server.listen(stdio());
}

main();
