import { Language } from '../../domain/entities/language.entity';
import { Runtime } from '../../domain/entities/runtime.entity';
import { Framework } from '../../domain/entities/framework.entity';
import { Specialization } from '../../domain/entities/specialization.entity';

// In-memory maps to act as a database for the knowledge graph
const languages = new Map<string, Language>();
const runtimes = new Map<string, Runtime>();
const frameworks = new Map<string, Framework>();
const specializations = new Map<string, Specialization>();

export const inMemoryKnowledgeGraphAdapter = {
    // Language
    saveLanguage: async (entity: Language) => { languages.set(entity.id, entity); },

    // Runtime
    saveRuntime: async (entity: Runtime) => { runtimes.set(entity.id, entity); },

    // Framework
    saveFramework: async (entity: Framework) => { frameworks.set(entity.id, entity); },

    // Specialization
    saveSpecialization: async (entity: Specialization) => { specializations.set(entity.id, entity); },
    findSpecializationByName: async (name: string): Promise<Specialization | null> => {
        for (const spec of specializations.values()) {
            if (spec.state.name === name) {
                return spec;
            }
        }
        return null;
    },
};