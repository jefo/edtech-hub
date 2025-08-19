import { KnowledgeLanguage, NodeTypeDefinition, EdgeTypeDefinition } from './language-definition';

// --- TYPE DEFINITIONS ---

/** Represents an instance of a node in a specific knowledge area. */
export interface NodeUsage {
    id: string; // Unique ID within the area, e.g., the name.
    definition: NodeTypeDefinition;
}

/** Represents an instance of an edge connecting two nodes in a specific knowledge area. */
export interface EdgeUsage {
    source: NodeUsage;
    target: NodeUsage;
    definition: EdgeTypeDefinition;
}

/** A container for the complete, validated graph of a specific knowledge area. */
export interface KnowledgeArea {
    language: KnowledgeLanguage;
    nodes: Map<string, NodeUsage>;
    edges: EdgeUsage[];
}

/** The interface provided to the user within the knowledgeArea callback. */
interface AreaBuilder {
    /**
     * Creates an instance (a "usage") of a node in the knowledge area.
     * @param id A unique identifier for this node within the area (e.g., its name).
     * @param spec An object specifying which NodeTypeDefinition this node is an instance of.
     * @returns A NodeUsage object that can be used in edges.
     */
    usage(id: string, spec: { isA: string }): NodeUsage;

    /**
     * Creates an instance of a semantic relationship (an edge) between two nodes.
     * @param spec An object defining the source, target, and type of the edge.
     */
    edge(spec: { from: NodeUsage; to: NodeUsage; isA: string }): void;
}

// --- IMPLEMENTATION ---

/**
 * The entry point for building a specific knowledge area graph using a predefined language.
 * @param language The KnowledgeLanguage containing the rules for this domain.
 * @param builderFn A callback function that receives a builder object to create node and edge instances.
 * @returns A validated KnowledgeArea object.
 */
export function knowledgeArea(language: KnowledgeLanguage, builderFn: (area: AreaBuilder) => void): KnowledgeArea {
    const nodes = new Map<string, NodeUsage>();
    const edges: EdgeUsage[] = [];

    const builder: AreaBuilder = {
        usage(id: string, spec: { isA: string }): NodeUsage {
            if (nodes.has(id)) {
                throw new Error(`Node usage '${id}' is already defined in this area.`);
            }
            const nodeTypeName = spec.isA;
            const definition = language.nodeTypes.get(nodeTypeName);
            if (!definition) {
                throw new Error(`Node type '${nodeTypeName}' is not defined in the provided language.`);
            }
            const nodeUsage: NodeUsage = { id, definition };
            nodes.set(id, nodeUsage);
            return nodeUsage;
        },

        edge(spec: { from: NodeUsage; to: NodeUsage; isA: string }): void {
            const edgeTypeName = spec.isA;
            const definition = language.edgeTypes.get(edgeTypeName);

            // Validation Step 1: Edge type must exist.
            if (!definition) {
                throw new Error(`Edge type '${edgeTypeName}' is not defined in the provided language.`);
            }

            // Validation Step 2: Source and Target nodes must conform to the edge's semantic constraints.
            if (spec.from.definition.name !== definition.source.name) {
                throw new Error(`Edge type '${edgeTypeName}' requires a source node of type '${definition.source.name}', but got a '${spec.from.definition.name}'.`);
            }
            if (spec.to.definition.name !== definition.target.name) {
                throw new Error(`Edge type '${edgeTypeName}' requires a target node of type '${definition.target.name}', but got a '${spec.to.definition.name}'.`);
            }

            const edgeUsage: EdgeUsage = { source: spec.from, target: spec.to, definition };
            edges.push(edgeUsage);
        }
    };

    builderFn(builder);

    return { language, nodes, edges };
}
