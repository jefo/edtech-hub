import { Skill } from '@lms/domain/skill/skill.aggregate';

// In-memory map to act as a database for skills.
const skillsDb = new Map<string, Skill>();

export const inMemorySkillAdapter = {
  findSkillById: async ({ id }: { id: string }): Promise<Skill | null> => {
    return skillsDb.get(id) || null;
  },

  findSkillsByIds: async ({ ids }: { ids: string[] }): Promise<Skill[]> => {
    return ids.map(id => skillsDb.get(id)).filter(Boolean) as Skill[];
  },

  saveSkill: async (skill: Skill): Promise<void> => {
    skillsDb.set(skill.state.id, skill);
  },

  getAllSkills: async (): Promise<Skill[]> => {
    return Array.from(skillsDb.values());
  },

  clear: () => {
      skillsDb.clear();
  }
};