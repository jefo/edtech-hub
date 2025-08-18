import { createPort } from '@sota/core/di';
import { LearnerProfile } from './learner-profile.aggregate';

export const findLearnerProfileByIdPort = createPort<(dto: { id: string }) => Promise<LearnerProfile | null>>();

export const saveLearnerProfilePort = createPort<(profile: LearnerProfile) => Promise<void>>();
