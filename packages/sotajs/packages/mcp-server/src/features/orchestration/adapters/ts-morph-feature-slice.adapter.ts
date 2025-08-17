import { Project } from "ts-morph";
import { FeatureSlice } from "../domain/feature-slice.aggregate";
import { usePort } from '@sota/core/di';
import { writeFilePort } from "../filesystem/ports";

// This is the Adapter that implements the rendering logic.
// It depends on the writeFilePort to save the generated files.
export async function tsMorphFeatureSliceAdapter(slice: FeatureSlice): Promise<{ filePath: string; content: string }[]> {
  const writeFile = usePort(writeFilePort);
  
  console.log(`[TsMorphAdapter] Rendering FeatureSlice: ${slice.name}`);

  const project = new Project();

  // TODO: Implement the logic to create source files using ts-morph
  // based on the slice.state properties.

  // For now, we'll just create a placeholder file.
  const placeholderFilePath = `lib/${slice.name}/placeholder.ts`;
  const sourceFile = project.createSourceFile(placeholderFilePath, `// ${slice.name} - Coming soon!`);

  const generatedFile = {
    filePath: sourceFile.getFilePath(),
    content: sourceFile.getFullText(),
  };

  // In a real implementation, we would call writeFile here.
  // For now, we just return the definition.
  // await writeFile(generatedFile.filePath, generatedFile.content);

  console.log(`[TsMorphAdapter] Finished rendering for ${slice.name}`);

  return [generatedFile];
}
