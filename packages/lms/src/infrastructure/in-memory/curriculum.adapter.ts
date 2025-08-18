import { Curriculum } from '@lms/domain/curriculum/curriculum.aggregate';

const curriculumDb = new Map<string, Curriculum>();

export const inMemoryCurriculumAdapter = {
  findCurriculumById: async ({ id }: { id: string }): Promise<Curriculum | null> => {
    return curriculumDb.get(id) || null;
  },

  saveCurriculum: async (curriculum: Curriculum): Promise<void> => {
    curriculumDb.set(curriculum.state.id, curriculum);
  },

  clear: () => {
    curriculumDb.clear();
  }
};