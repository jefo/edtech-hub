import { createPort } from '@sota/core/di';
import { Curriculum } from './curriculum.aggregate';
import { Module } from './module.entity';
import { Lesson } from './lesson.entity';

// Ports for saving our new entities and aggregate
export const saveCurriculumPort = createPort<(curriculum: Curriculum) => Promise<void>>();
export const saveModulePort = createPort<(module: Module) => Promise<void>>();
export const saveLessonPort = createPort<(lesson: Lesson) => Promise<void>>();