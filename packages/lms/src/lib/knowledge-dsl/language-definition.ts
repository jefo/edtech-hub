/**
 * This file contains the core logic for the first step of the MBSE-inspired process:
 * Defining the "language" of a knowledge domain.
 */

// --- TYPE DEFINITIONS ---

/** Represents the definition of a type of node, e.g., 'Paradigm' or 'Pattern'. It's a blueprint. */
export interface NodeTypeDefinition {
    name: string;
}

/** Represents the definition of a type of edge, including its semantic constraints. */
export interface EdgeTypeDefinition {
    name: string;
    source: NodeTypeDefinition; // The type of node this edge must originate from.
    target: NodeTypeDefinition; // The type of node this edge must point to.
}

/** A container for all the definitions that make up the language of a specific knowledge domain. */
export interface KnowledgeLanguage {
    nodeTypes: Map<string, NodeTypeDefinition>;
    edgeTypes: Map<string, EdgeTypeDefinition>;
}

/** The interface provided to the user within the defineKnowledgeLanguage callback. */
interface LanguageBuilder {
    /**
     * Defines a new type of node that can exist in this knowledge domain.
     * @param name The name of the node type, e.g., 'Concept', 'Framework'.
     * @returns A NodeTypeDefinition that can be used in edge constraints.
     */
    defineNodeType(name: string): NodeTypeDefinition;

    /**
     * Defines a new type of semantic relationship (edge) and its constraints.
     * @param definition An object containing the name, source type, and target type.
     */
    defineEdgeType(definition: { name: string; source: NodeTypeDefinition; target: NodeTypeDefinition }): void;
}

// --- IMPLEMENTATION ---

/**
 * The entry point for defining a knowledge domain's language.
 * @param builderFn A callback function that receives a builder object to define node and edge types.
 * @returns A compiled KnowledgeLanguage object containing the domain's rules.
 */
export function defineKnowledgeLanguage(builderFn: (lang: LanguageBuilder) => void): KnowledgeLanguage {
    const nodeTypes = new Map<string, NodeTypeDefinition>();
    const edgeTypes = new Map<string, EdgeTypeDefinition>();

    const builder: LanguageBuilder = {
        defineNodeType(name: string): NodeTypeDefinition {
            if (nodeTypes.has(name)) {
                throw new Error(`Node type '${name}' is already defined.`);
            }
            const nodeType: NodeTypeDefinition = { name };
            nodeTypes.set(name, nodeType);
            return nodeType;
        },

        defineEdgeType(definition: { name: string; source: NodeTypeDefinition; target: NodeTypeDefinition }): void {
            if (edgeTypes.has(definition.name)) {
                throw new Error(`Edge type '${definition.name}' is already defined.`);
            }
            // Ensure the source and target node types themselves have been defined.
            if (!nodeTypes.has(definition.source.name) || !nodeTypes.has(definition.target.name)) {
                throw new Error(`Cannot define edge type '${definition.name}' with an unregistered source or target node type.`);
            }
            const edgeType: EdgeTypeDefinition = { ...definition };
            edgeTypes.set(definition.name, edgeType);
        }
    };

    // Execute the user-provided function to populate the definitions
    builderFn(builder);

    return { nodeTypes, edgeTypes };
}
