import { LearnerProfile } from '@lms/domain/learner/learner-profile.aggregate';

const learnerProfileDb = new Map<string, LearnerProfile>();

export const inMemoryLearnerProfileAdapter = {
  findLearnerProfileById: async ({ id }: { id: string }): Promise<LearnerProfile | null> => {
    return learnerProfileDb.get(id) || null;
  },

  saveLearnerProfile: async (profile: LearnerProfile): Promise<void> => {
    learnerProfileDb.set(profile.state.id, profile);
  },

  clear: () => {
    learnerProfileDb.clear();
  }
};