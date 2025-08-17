import { createPort } from '@sota/core/di';
import { Skill } from './skill.aggregate';

// Port to find a single skill by its ID.
// Needed by the use case to get the input skills.
export const findSkillByIdPort = createPort<(dto: { id: string }) => Promise<Skill | null>>();

// Port to find multiple skills by their IDs.
// Might be useful for fetching all prerequisites at once.
export const findSkillsByIdsPort = createPort<(dto: { ids: string[] }) => Promise<Skill[]>>();

// Port to save a skill.
export const saveSkillPort = createPort<(skill: Skill) => Promise<void>>();
