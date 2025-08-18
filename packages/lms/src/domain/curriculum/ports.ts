import { createPort } from '@sota/core/di';
import { Curriculum } from './curriculum.aggregate';

export const findCurriculumByIdPort = createPort<(dto: { id: string }) => Promise<Curriculum | null>>();

export const saveCurriculumPort = createPort<(curriculum: Curriculum) => Promise<void>>();
