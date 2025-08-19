import { knowledgeArea } from '../../lib/knowledge-dsl';
import { dddMetamodel } from './ddd.metamodel';

/**
 * This file is the primary knowledge base (ABox) for Domain-Driven Design.
 * It uses the dddMetamodel to define instances of all DDD patterns,
 * principles, and their relationships, following a pedagogical structure.
 */
export const dddKnowledgeBase = knowledgeArea(dddMetamodel, (area) => {
    // =================================================================
    // == 1. DEFINE LEARNING TOPICS (The Narrative Flow)
    // =================================================================
    const topic1 = area.usage('Putting the Domain Model to Work', { isA: 'LearningTopic' });
    const topic2 = area.usage('The Building Blocks of a Model-Driven Design', { isA: 'LearningTopic' });
    const topic3 = area.usage('Refactoring Toward Deeper Insight', { isA: 'LearningTopic' });
    const topic4 = area.usage('Strategic Design', { isA: 'LearningTopic' });

    // Define the narrative sequence
    area.edge({ from: topic1, to: topic2, isA: 'PRECEDES' });
    area.edge({ from: topic2, to: topic3, isA: 'PRECEDES' });
    area.edge({ from: topic3, to: topic4, isA: 'PRECEDES' });

    // =================================================================
    // == 2. DEFINE PRINCIPLES
    // =================================================================
    const ubiquitousLanguagePrinciple = area.usage('Ubiquitous Language', { isA: 'Principle' });
    area.edge({ from: topic1, to: ubiquitousLanguagePrinciple, isA: 'INTRODUCES_PRINCIPLE' });


    // =================================================================
    // == 1. DEFINE LEARNING TOPICS (The Narrative Flow)
    // =================================================================
    const topic1 = area.usage('Putting the Domain Model to Work', { isA: 'LearningTopic' });
    const topic2 = area.usage('The Building Blocks of a Model-Driven Design', { isA: 'LearningTopic' });
    const topic3 = area.usage('Refactoring Toward Deeper Insight', { isA: 'LearningTopic' });
    const topic4 = area.usage('Strategic Design', { isA: 'LearningTopic' });

    // Define the narrative sequence
    area.edge({ from: topic1, to: topic2, isA: 'PRECEDES' });
    area.edge({ from: topic2, to: topic3, isA: 'PRECEDES' });
    area.edge({ from: topic3, to: topic4, isA: 'PRECEDES' });

    // =================================================================
    // == 2. DEFINE PRINCIPLES
    // =================================================================
    const ubiquitousLanguagePrinciple = area.usage('Ubiquitous Language', { isA: 'Principle' });
    area.edge({ from: topic1, to: ubiquitousLanguagePrinciple, isA: 'INTRODUCES_PRINCIPLE' });


    // =================================================================
    // == 3. DEFINE PATTERNS & THEIR CONTEXT/PROBLEM/SOLUTION
    // =================================================================

    // --- Bounded Context Pattern ---
    const boundedContextPattern = area.usage('Bounded Context', { isA: 'Pattern' });
    area.edge({ from: topic4, to: boundedContextPattern, isA: 'INTRODUCES' }); // Introduced in Strategic Design

    const bcContext = area.usage('When dealing with large, complex systems where different parts of the domain may have different models or interpretations of the same terms.', { isA: 'Context' });
    const bcProblem = area.usage('How to manage complexity in large systems by explicitly defining the boundaries within which a particular domain model is consistent and applicable, avoiding ambiguity and ensuring model integrity.', { isA: 'Problem' });
    const bcSolution = area.usage('Define a Bounded Context as a specific boundary within which a particular domain model is defined and consistent. Each Bounded Context has its own Ubiquitous Language and model, and interactions between contexts are explicit.', { isA: 'Solution' });

    area.edge({ from: boundedContextPattern, to: bcContext, isA: 'APPLIES_IN' });
    area.edge({ from: boundedContextPattern, to: bcProblem, isA: 'ADDRESSES' });
    area.edge({ from: boundedContextPattern, to: bcSolution, isA: 'PROVIDES' });
    area.edge({ from: boundedContextPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

    // --- Context Map Pattern ---
    const contextMapPattern = area.usage('Context Map', { isA: 'Pattern' });
    area.edge({ from: topic4, to: contextMapPattern, isA: 'INTRODUCES' }); // Introduced in Strategic Design

    const cmContext = area.usage('When multiple Bounded Contexts exist within a larger system, and you need to understand and visualize their relationships.', { isA: 'Context' });
    const cmProblem = area.usage('How to gain a high-level overview of the system\'s landscape, identify integration points, and understand the nature of relationships between different Bounded Contexts.', { isA: 'Problem' });
    const cmSolution = area.usage('Create a Context Map, a diagram or document that illustrates the relationships between different Bounded Contexts. It helps in understanding the overall system architecture and identifying potential integration challenges.', { isA: 'Solution' });

    area.edge({ from: contextMapPattern, to: cmContext, isA: 'APPLIES_IN' });
    area.edge({ from: contextMapPattern, to: cmProblem, isA: 'ADDRESSES' });
    area.edge({ from: contextMapPattern, to: cmSolution, isA: 'PROVIDES' });
    area.edge({ from: contextMapPattern, to: boundedContextPattern, isA: 'COMPLEMENTS' }); // Context Map complements Bounded Context
    area.edge({ from: contextMapPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' }); // Ubiquitous Language is key for Context Maps


    // --- Aggregate Pattern ---
    const aggregatePattern = area.usage('Aggregate', { isA: 'Pattern' });
    area.edge({ from: topic2, to: aggregatePattern, isA: 'INTRODUCES' });

    const aggregateContext = area.usage('A complex model with many interrelated objects.', { isA: 'Context' });
    const aggregateProblem = area.usage('How to maintain consistency and enforce invariants across a cluster of related objects, ensuring transactional integrity without cluttering the model.', { isA: 'Problem' });
    const aggregateSolution = area.usage('Define a clear boundary (the Aggregate) around a group of objects, with a single entry point (the Aggregate Root). External objects can only hold a reference to the root, which is responsible for enforcing all business rules and invariants for the entire cluster.', { isA: 'Solution' });

    area.edge({ from: aggregatePattern, to: aggregateContext, isA: 'APPLIES_IN' });
    area.edge({ from: aggregatePattern, to: aggregateProblem, isA: 'ADDRESSES' });
    area.edge({ from: aggregatePattern, to: aggregateSolution, isA: 'PROVIDES' });
    area.edge({ from: aggregatePattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

    // --- Entity Pattern ---
    const entityPattern = area.usage('Entity', { isA: 'Pattern' });
    area.edge({ from: topic2, to: entityPattern, isA: 'INTRODUCES' });

    const entityContext = area.usage('When an object is not defined by its attributes, but rather by a thread of continuity and identity.', { isA: 'Context' });
    const entityProblem = area.usage('How to model objects whose identity is fundamental and must be tracked through different states or even across different systems.', { isA: 'Problem' });
    const entitySolution = area.usage('Create an object with a unique, stable identifier. Equality is based on this ID, not on the object\'s attributes.', { isA: 'Solution' });

    area.edge({ from: entityPattern, to: entityContext, isA: 'APPLIES_IN' });
    area.edge({ from: entityPattern, to: entityProblem, isA: 'ADDRESSES' });
    area.edge({ from: entityPattern, to: entitySolution, isA: 'PROVIDES' });
    area.edge({ from: entityPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });
    area.edge({ from: aggregatePattern, to: entityPattern, isA: 'REFINES' }); // An Aggregate is a specialized Entity

    // --- Value Object Pattern ---
    const valueObjectPattern = area.usage('Value Object', { isA: 'Pattern' });
    area.edge({ from: topic2, to: valueObjectPattern, isA: 'INTRODUCES' });

    const voContext = area.usage('When an object is used to describe characteristics or qualities of other objects.', { isA: 'Context' });
    const voProblem = area.usage('How to model descriptive aspects of the domain that have no conceptual identity, avoiding the overhead and complexity of identity tracking.', { isA: 'Problem' });
    const voSolution = area.usage('Create an immutable object defined by its attributes. Equality is based on the values of its attributes, not on an ID.', { isA: 'Solution' });

    area.edge({ from: valueObjectPattern, to: voContext, isA: 'APPLIES_IN' });
    area.edge({ from: valueObjectPattern, to: voProblem, isA: 'ADDRESSES' });
    area.edge({ from: valueObjectPattern, to: voSolution, isA: 'PROVIDES' });
    area.edge({ from: aggregatePattern, to: valueObjectPattern, isA: 'COMPLEMENTS' });
    area.edge({ from: entityPattern, to: valueObjectPattern, isA: 'COMPLEMENTS' });

    // --- Domain Service Pattern ---
    const domainServicePattern = area.usage('Domain Service', { isA: 'Pattern' });
    area.edge({ from: topic2, to: domainServicePattern, isA: 'INTRODUCES' });

    const dsContext = area.usage('When an operation does not naturally fit within an Entity or Value Object, and it involves multiple domain objects.', { isA: 'Context' });
    const dsProblem = area.usage('How to model domain logic that is significant but doesn\'t belong to a single object, avoiding anemic domain models or procedural code.', { isA: 'Problem' });
    const dsSolution = area.usage('Create a stateless service in the domain layer that performs an operation involving multiple domain objects, representing a significant domain concept.', { isA: 'Solution' });

    area.edge({ from: domainServicePattern, to: dsContext, isA: 'APPLIES_IN' });
    area.edge({ from: domainServicePattern, to: dsProblem, isA: 'ADDRESSES' });
    area.edge({ from: domainServicePattern, to: dsSolution, isA: 'PROVIDES' });
    area.edge({ from: domainServicePattern, to: aggregatePattern, isA: 'COMPLEMENTS' });
    area.edge({ from: domainServicePattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

    // --- Factory Pattern ---
    const factoryPattern = area.usage('Factory', { isA: 'Pattern' });
    area.edge({ from: topic2, to: factoryPattern, isA: 'INTRODUCES' });

    const factoryContext = area.usage('When the creation of a complex Aggregate or other domain object requires significant internal logic or assembly, and exposing this logic would clutter the client.', { isA: 'Context' });
    const factoryProblem = area.usage('How to encapsulate the complex creation logic of domain objects, ensuring they are always created in a valid state, without making the client responsible for their internal construction.', { isA: 'Problem' });
    const factorySolution = area.usage('Create a Factory that encapsulates the assembly of complex domain objects, especially Aggregates. The Factory ensures that the created object is valid and consistent, returning a fully formed instance to the client.', { isA: 'Solution' });

    area.edge({ from: factoryPattern, to: factoryContext, isA: 'APPLIES_IN' });
    area.edge({ from: factoryPattern, to: factoryProblem, isA: 'ADDRESSES' });
    area.edge({ from: factoryPattern, to: factorySolution, isA: 'PROVIDES' });
    area.edge({ from: factoryPattern, to: aggregatePattern, isA: 'COMPLEMENTS' });
    area.edge({ from: factoryPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

    // --- Repository Pattern ---
    const repositoryPattern = area.usage('Repository', { isA: 'Pattern' });
    area.edge({ from: topic2, to: repositoryPattern, isA: 'INTRODUCES' });

    const repoContext = area.usage('When you need to retrieve or persist Aggregates or other complex domain objects, abstracting away the details of data storage.', { isA: 'Context' });
    const repoProblem = area.usage('How to provide access to Aggregates (or other root Entities) without exposing the complexities of the underlying database or persistence mechanism to the domain model.', { isA: 'Problem' });
    const repoSolution = area.usage('Create a Repository that acts as an in-memory collection of domain objects. It encapsulates the logic for querying and persisting Aggregates, providing a clean interface to the domain.', { isA: 'Solution' });

    area.edge({ from: repositoryPattern, to: repoContext, isA: 'APPLIES_IN' });
    area.edge({ from: repositoryPattern, to: repoProblem, isA: 'ADDRESSES' });
    area.edge({ from: repositoryPattern, to: repoSolution, isA: 'PROVIDES' });
    area.edge({ from: repositoryPattern, to: aggregatePattern, isA: 'COMPLEMENTS' });
    area.edge({ from: repositoryPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

    // --- Module Pattern ---
    const modulePattern = area.usage('Module', { isA: 'Pattern' });
    area.edge({ from: topic2, to: modulePattern, isA: 'INTRODUCES' });

    const moduleContext = area.usage('When a Bounded Context grows large and complex, containing many related but distinct concepts.', { isA: 'Context' });
    const moduleProblem = area.usage('How to organize the domain model into smaller, more manageable parts to reduce cognitive overload and improve navigation, without creating artificial boundaries.', { isA: 'Problem' });
    const moduleSolution = area.usage('Use Modules (e.g., namespaces, packages, folders) to group related concepts and tasks within a Bounded Context. Modules should reflect logical divisions within the domain.', { isA: 'Solution' });

    area.edge({ from: modulePattern, to: moduleContext, isA: 'APPLIES_IN' });
    area.edge({ from: modulePattern, to: moduleProblem, isA: 'ADDRESSES' });
    area.edge({ from: modulePattern, to: moduleSolution, isA: 'PROVIDES' });
    area.edge({ from: modulePattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });
    area.edge({ from: modulePattern, to: aggregatePattern, isA: 'COMPLEMENTS' }); // Modules contain aggregates

    // --- Shared Kernel Pattern ---
    const sharedKernelPattern = area.usage('Shared Kernel', { isA: 'Pattern' });
    area.edge({ from: topic4, to: sharedKernelPattern, isA: 'INTRODUCES' }); // Introduced in Strategic Design

    const skContext = area.usage('When two or more Bounded Contexts share a common, well-defined subset of the domain model, and the cost of maintaining separate models is too high.', { isA: 'Context' });
    const skProblem = area.usage('How to reduce duplication and ensure consistency between tightly coupled Bounded Contexts that need to share a common understanding of a core domain concept.', { isA: 'Problem' });
    const skSolution = area.usage('Identify a subset of the domain model that is genuinely shared and understood by all participating teams. This Shared Kernel becomes part of the model of each context, and changes to it require coordination among all teams.', { isA: 'Solution' });

    area.edge({ from: sharedKernelPattern, to: skContext, isA: 'APPLIES_IN' });
    area.edge({ from: sharedKernelPattern, to: skProblem, isA: 'ADDRESSES' });
    area.edge({ from: sharedKernelPattern, to: skSolution, isA: 'PROVIDES' });
    area.edge({ from: sharedKernelPattern, to: boundedContextPattern, isA: 'COMPLEMENTS' });
    area.edge({ from: sharedKernelPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

    // --- Customer-Supplier Pattern ---
    const customerSupplierPattern = area.usage('Customer-Supplier', { isA: 'Pattern' });
    area.edge({ from: topic4, to: customerSupplierPattern, isA: 'INTRODUCES' }); // Introduced in Strategic Design

    const csContext = area.usage('When one Bounded Context (the Customer) depends on another Bounded Context (the Supplier) for a specific service or data, and the Customer has influence over the Supplier\'s development.', { isA: 'Context' });
    const csProblem = area.usage('How to manage the dependency between two Bounded Contexts where one is a client of the other, ensuring that the Customer\'s needs are met and the Supplier\'s model evolves in a way that supports the Customer.', { isA: 'Problem' });
    const csSolution = area.usage('Establish a clear Customer-Supplier relationship. The Customer team actively works with the Supplier team, providing input and influencing the Supplier\'s backlog. This ensures the Supplier\'s model evolves to meet the Customer\'s needs.', { isA: 'Solution' });

    area.edge({ from: customerSupplierPattern, to: csContext, isA: 'APPLIES_IN' });
    area.edge({ from: customerSupplierPattern, to: csProblem, isA: 'ADDRESSES' });
    area.edge({ from: customerSupplierPattern, to: csSolution, isA: 'PROVIDES' });
    area.edge({ from: customerSupplierPattern, to: boundedContextPattern, isA: 'COMPLEMENTS' });
    area.edge({ from: customerSupplierPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

    // --- Conformist Pattern ---
    const conformistPattern = area.usage('Conformist', { isA: 'Pattern' });
    area.edge({ from: topic4, to: conformistPattern, isA: 'INTRODUCES' }); // Introduced in Strategic Design

    const conformistContext = area.usage('When a downstream Bounded Context needs to integrate with an upstream Bounded Context, but has no influence over the upstream\'s model or development.', { isA: 'Context' });
    const conformistProblem = area.usage('How to integrate with an external system whose model you cannot change, without incurring the cost of a full Anti-Corruption Layer.', { isA: 'Problem' });
    const conformistSolution = area.usage('The downstream team chooses to conform to the upstream model, adopting its Ubiquitous Language and model directly. This simplifies integration but means the downstream context is highly coupled to the upstream\'s evolution.', { isA: 'Solution' });

    area.edge({ from: conformistPattern, to: conformistContext, isA: 'APPLIES_IN' });
    area.edge({ from: conformistPattern, to: conformistProblem, isA: 'ADDRESSES' });
    area.edge({ from: conformistPattern, to: conformistSolution, isA: 'PROVIDES' });
    area.edge({ from: conformistPattern, to: boundedContextPattern, isA: 'COMPLEMENTS' });
    area.edge({ from: conformistPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

    // --- Anti-Corruption Layer Pattern ---
    const antiCorruptionLayerPattern = area.usage('Anti-Corruption Layer', { isA: 'Pattern' });
    area.edge({ from: topic4, to: antiCorruptionLayerPattern, isA: 'INTRODUCES' }); // Introduced in Strategic Design

    const aclContext = area.usage('When a Bounded Context needs to integrate with an external system (e.g., a legacy system, a third-party service) whose model is fundamentally different and cannot be easily adapted.', { isA: 'Context' });
    const aclProblem = area.usage('How to protect the integrity of your domain model from the pervasive influence of an external system\'s foreign model, preventing it from \"corrupting\" your own Ubiquitous Language and design.', { isA: 'Problem' });
    const aclSolution = area.usage('Create an Anti-Corruption Layer (ACL) as an isolation layer between your Bounded Context and the external system. The ACL translates between the two models, ensuring your domain model remains pure and consistent.', { isA: 'Solution' });

    area.edge({ from: antiCorruptionLayerPattern, to: aclContext, isA: 'APPLIES_IN' });
    area.edge({ from: antiCorruptionLayerPattern, to: aclProblem, isA: 'ADDRESSES' });
    area.edge({ from: antiCorruptionLayerPattern, to: aclSolution, isA: 'PROVIDES' });
    area.edge({ from: antiCorruptionLayerPattern, to: boundedContextPattern, isA: 'COMPLEMENTS' });
    area.edge({ from: antiCorruptionLayerPattern, to: ubiquitousLanguagePrinciple, isA: 'IMPLEMENTS' });

});