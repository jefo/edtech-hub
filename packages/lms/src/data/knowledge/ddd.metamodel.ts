import { defineKnowledgeLanguage } from '../../lib/knowledge-dsl';

/**
 * This file defines the final, pedagogically-driven meta-language (TBox)
 * for describing the knowledge domain of Domain-Driven Design.
 * This model is designed to capture the narrative structure of seminal DDD texts,
 * making it ideal for generating high-quality educational materials.
 */
export const dddMetamodel = defineKnowledgeLanguage((lang) => {
    // =================================================================
    // == 1. DEFINE NODE TYPES (The Meta-Concepts)
    // =================================================================
    const LearningTopic = lang.defineNodeType('LearningTopic');
    const Category = lang.defineNodeType('Category');
    const Principle = lang.defineNodeType('Principle');
    const Pattern = lang.defineNodeType('Pattern');
    const Context = lang.defineNodeType('Context');
    const Problem = lang.defineNodeType('Problem');
    const Solution = lang.defineNodeType('Solution');

    // =================================================================
    // == 2. DEFINE EDGE TYPES (The Meta-Relationships)
    // =================================================================

    // --- Pedagogical Structure ---
    lang.defineEdgeType({ name: 'PRECEDES', source: LearningTopic, target: LearningTopic });
    lang.defineEdgeType({ name: 'INTRODUCES', source: LearningTopic, target: Pattern });
    lang.defineEdgeType({ name: 'INTRODUCES_PRINCIPLE', source: LearningTopic, target: Principle });
    lang.defineEdgeType({ name: 'CONTAINS', source: Category, target: Pattern });


    // --- Pattern Definition ---
    lang.defineEdgeType({ name: 'APPLIES_IN', source: Pattern, target: Context });
    lang.defineEdgeType({ name: 'ADDRESSES', source: Pattern, target: Problem });
    lang.defineEdgeType({ name: 'PROVIDES', source: Pattern, target: Solution });
    lang.defineEdgeType({ name: 'IMPLEMENTS', source: Pattern, target: Principle });

    // --- Inter-Pattern Relationships ---
    lang.defineEdgeType({ name: 'REFINES', source: Pattern, target: Pattern });
    lang.defineEdgeType({ name: 'COMPLEMENTS', source: Pattern, target: Pattern });
    lang.defineEdgeType({ name: 'CONSTRAINS', source: Pattern, target: Pattern });
    lang.defineEdgeType({ name: 'CONTRASTS_WITH', source: Pattern, target: Pattern });
});