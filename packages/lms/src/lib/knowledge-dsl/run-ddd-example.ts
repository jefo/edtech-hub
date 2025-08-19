import { defineKnowledgeLanguage, knowledgeArea } from './index';

console.log('--- Defining the language for Domain-Driven Design ---');

const dddLanguage = defineKnowledgeLanguage((lang) => {
    // 1. Define the types of nodes we can have
    const BoundedContext = lang.defineNodeType('Bounded Context');
    const Aggregate = lang.defineNodeType('Aggregate');
    const Entity = lang.defineNodeType('Entity');
    const ValueObject = lang.defineNodeType('Value Object');
    const DomainEvent = lang.defineNodeType('Domain Event');

    // 2. Define the types of relationships and their rules
    lang.defineEdgeType({ name: 'CONTAINS', source: BoundedContext, target: Aggregate });
    lang.defineEdgeType({ name: 'COMPRISES_ENTITY', source: Aggregate, target: Entity });
    lang.defineEdgeType({ name: 'COMPRISES_VALUE_OBJECT', source: Aggregate, target: ValueObject });
    lang.defineEdgeType({ name: 'RAISES', source: Aggregate, target: DomainEvent });
});

console.log('Language defined successfully!');
console.log('\n--- Building a specific Knowledge Area for a sample project ---');

const orderingContextArea = knowledgeArea(dddLanguage, (area) => {
    // 1. Create instances (usages) of our nodes
    const orderingContext = area.usage('Ordering', { isA: 'Bounded Context' });
    const orderAggregate = area.usage('Order', { isA: 'Aggregate' });
    const orderItemEntity = area.usage('OrderItem', { isA: 'Entity' });
    const moneyVO = area.usage('Money', { isA: 'Value Object' });
    const orderPlacedEvent = area.usage('OrderPlaced', { isA: 'Domain Event' });

    // 2. Create valid edges between them
    area.edge({ from: orderingContext, to: orderAggregate, isA: 'CONTAINS' });
    area.edge({ from: orderAggregate, to: orderItemEntity, isA: 'COMPRISES_ENTITY' });
    area.edge({ from: orderAggregate, to: moneyVO, isA: 'COMPRISES_VALUE_OBJECT' });
    area.edge({ from: orderAggregate, to: orderPlacedEvent, isA: 'RAISES' });

    console.log('\nKnowledge Area built successfully:');
    console.log(`- Node: ${orderingContext.id} (Type: ${orderingContext.definition.name})`);
    console.log(`- Node: ${orderAggregate.id} (Type: ${orderAggregate.definition.name})`);
    console.log(`- Node: ${orderItemEntity.id} (Type: ${orderItemEntity.definition.name})`);

    // 3. Attempt to create an invalid edge to test constraints
    try {
        console.log('\nAttempting to create an invalid edge (Aggregate cannot contain a Bounded Context)...');
        area.edge({ from: orderAggregate, to: orderingContext, isA: 'CONTAINS' });
    } catch (error) {
        console.log(`\nSuccessfully caught expected error:`);
        console.error(` -> ${error.message}`);
    }
});

console.log('\n--- DSL execution complete! ---');
