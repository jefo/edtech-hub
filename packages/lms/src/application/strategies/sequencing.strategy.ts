import { ModuleProps } from '@lms/domain/curriculum/module.entity';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { TransformationProps } from '@lms/domain/curriculum/transformation.vo';

export interface ICurriculumSequencingStrategy {
  sequence(gaps: TransformationProps[], skills: Map<string, Skill>): ModuleProps[];
}
