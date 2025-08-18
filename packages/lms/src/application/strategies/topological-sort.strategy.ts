import { Module } from '@lms/domain/curriculum/module.entity';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { Transformation } from '@lms/domain/curriculum/transformation.vo';
import { TransformationProps } from '@lms/domain/curriculum/transformation.vo';
import { ICurriculumSequencingStrategy } from './sequencing.strategy';

export class TopologicalSortStrategy implements ICurriculumSequencingStrategy {
  sequence(gaps: TransformationProps[], skills: Map<string, Skill>): Module[] {
    const modules: Module[] = [];
    let skillsForModuleGen = new Set(skills.keys());
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

      const transformations = gaps
        .filter(gap => moduleSkillIds.has(gap.skillId))
        .map(gap => Transformation.create(gap).props);

      if (transformations.length > 0) {
        const newModule = Module.create({
          id: crypto.randomUUID(),
          name: `Module ${moduleLevel}`,
          transformations: transformations,
        });
        modules.push(newModule);
        moduleLevel++;
      }

      moduleSkillIds.forEach(id => skillsForModuleGen.delete(id));
    }

    return modules;
  }
}
