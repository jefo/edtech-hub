import { setPortAdapter } from '@sota/core/di';
import { findSkillByIdPort, findSkillsByIdsPort, saveSkillPort } from '@lms/domain/skill/ports';
import { inMemorySkillAdapter } from './infrastructure/in-memory/skill.adapter';

// This function binds the abstract ports to their concrete in-memory implementations.
// In a real application, you would have different composition roots for
// different environments (e.g., production, testing).
export const compose = () => {
    setPortAdapter(findSkillByIdPort, inMemorySkillAdapter.findSkillById);
    setPortAdapter(findSkillsByIdsPort, inMemorySkillAdapter.findSkillsByIds);
    setPortAdapter(saveSkillPort, inMemorySkillAdapter.saveSkill);
    console.log('[CompositionRoot] In-memory adapters have been set.');
};