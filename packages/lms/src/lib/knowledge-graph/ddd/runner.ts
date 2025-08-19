import { composeDdd } from './composition-root';
import { seedDdd } from './infrastructure/in-memory/seed';
import { usePort } from '@sota/core/di';
import { findDddAggregateByNamePort } from './domain/ports';

async function main() {
    console.log('--- Running DDD Context Seeder ---');
    composeDdd();
    await seedDdd();

    console.log('\n--- Verifying DDD Seeded Data ---');
    const findAgg = usePort(findDddAggregateByNamePort);
    const aggregateConcept = await findAgg('Aggregate');

    if (aggregateConcept) {
        console.log(`Found Concept: ${aggregateConcept.state.name}`);
        console.log(`Description: ${aggregateConcept.state.description}`);
        console.log(`Composed of Entity IDs: ${aggregateConcept.state.entityIds.join(', ')}`);
        console.log(`Composed of Value Object IDs: ${aggregateConcept.state.valueObjectIds.join(', ')}`);
    } else {
        console.log('Could not find seeded Aggregate concept.');
    }
}

main().catch(console.error);
