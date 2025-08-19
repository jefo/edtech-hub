import { composeKnowledgeGraph } from './composition-root';
import { seedKnowledgeGraph } from './infrastructure/in-memory/seed';
import { usePort } from '@sota/core/di';
import { findSpecializationByNamePort } from './domain/ports';

async function main() {
    console.log('--- Running Knowledge Graph Seeder ---');
    composeKnowledgeGraph();
    await seedKnowledgeGraph();

    console.log('\n--- Verifying Seeded Data ---');
    const findSpec = usePort(findSpecializationByNamePort);
    const backendSpec = await findSpec('Backend Development');

    if (backendSpec) {
        console.log(`Found Specialization: ${backendSpec.state.name}`);
        console.log(`Linked Framework IDs: ${backendSpec.state.frameworkIds.join(', ')}`);
    } else {
        console.log('Could not find seeded specialization.');
    }
}

main().catch(console.error);
