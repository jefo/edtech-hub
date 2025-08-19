import { setPortAdapter } from '@sota/core/di';
import * as ports from './domain/ports';
import { inMemoryKnowledgeGraphAdapter } from './infrastructure/in-memory/knowledge-graph.adapter';

export const composeKnowledgeGraph = () => {
    setPortAdapter(ports.saveLanguagePort, inMemoryKnowledgeGraphAdapter.saveLanguage);
    setPortAdapter(ports.saveRuntimePort, inMemoryKnowledgeGraphAdapter.saveRuntime);
    setPortAdapter(ports.saveFrameworkPort, inMemoryKnowledgeGraphAdapter.saveFramework);
    setPortAdapter(ports.saveSpecializationPort, inMemoryKnowledgeGraphAdapter.saveSpecialization);
    setPortAdapter(ports.findSpecializationByNamePort, inMemoryKnowledgeGraphAdapter.findSpecializationByName);
    console.log('[KnowledgeGraph] Composition root configured.');
};