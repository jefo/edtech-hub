import { LearningObjective } from '@lms/domain/curriculum/learning-objective.vo';
import { Module } from '@lms/domain/curriculum/module.entity';
import { Lesson } from '@lms/domain/curriculum/lesson.entity';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { TransformationProps } from '@lms/domain/curriculum/transformation.vo';
import { ICurriculumSequencingStrategy } from './sequencing.strategy';

export class TopologicalSortStrategy implements ICurriculumSequencingStrategy {
  sequence(gaps: TransformationProps[], skills: Map<string, Skill>): ModuleProps[] {
    const modules: ModuleProps[] = [];
    const skillsForModuleGen = new Set(skills.keys());
    let moduleLevel = 1;

    while (skillsForModuleGen.size > 0) {
      const moduleSkillIds = new Set<string>();
      skillsForModuleGen.forEach(skillId => {
        const skill = skills.get(skillId);
        if (skill && skill.state.prerequisiteSkillIds.every(prereqId => !skillsForModuleGen.has(prereqId))) {
          moduleSkillIds.add(skillId);
        }
      });

      if (moduleSkillIds.size === 0 && skillsForModuleGen.size > 0) {
        throw new Error('Circular dependency detected in skills graph');
      }

      const transformations = gaps.filter(gap => moduleSkillIds.has(gap.skillId));

      if (transformations.length > 0) {
        const lessons = transformations.map((t, i) => {
            const skillName = skills.get(t.skillId)?.state.name || 'Unknown Skill';
            return Lesson.create({
                id: crypto.randomUUID(),
                name: `Introduction to ${skillName}`,
                sequence: i + 1,
                transformation: t,
                learningObjectives: [LearningObjective.create({ description: `Understand the core concepts of ${skillName}` }).props],
            }).props;
        });

        const newModule = Module.create({
          id: crypto.randomUUID(),
          name: `Module ${moduleLevel}`,
          lessons: lessons,
        });
        modules.push(newModule.props);
        moduleLevel++;
      }

      moduleSkillIds.forEach(id => skillsForModuleGen.delete(id));
    }

    return modules;
  }
}
