import { Module } from '@lms/domain/curriculum/module.entity';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { Transformation } from '@lms/domain/curriculum/transformation.vo';
import { TransformationProps } from '@lms/domain/curriculum/transformation.vo';
import { ICurriculumSequencingStrategy } from './sequencing.strategy';

// A simple, opinionated strategy for demonstration.
// It considers skills with no prerequisites of their own as 'foundational'.
export class ImmersivePracticeStrategy implements ICurriculumSequencingStrategy {
  sequence(gaps: TransformationProps[], skills: Map<string, Skill>): Module[] {
    const modules: Module[] = [];
    const skillsForModuleGen = new Set(skills.keys());
    let moduleLevel = 1;

    // Identify foundational skills (no prereqs within the gap)
    const foundationalSkillIds = new Set<string>();
    skills.forEach(skill => {
        if (skill.state.prerequisiteSkillIds.length === 0) {
            foundationalSkillIds.add(skill.state.id);
        }
    });

    let pendingFoundationalTransforms: TransformationProps[] = [];

    while (skillsForModuleGen.size > 0) {
      const levelSkillIds = new Set<string>();
      skillsForModuleGen.forEach(skillId => {
        const skill = skills.get(skillId);
        if (skill && skill.state.prerequisiteSkillIds.every(prereqId => !skillsForModuleGen.has(prereqId))) {
          levelSkillIds.add(skillId);
        }
      });

      if (levelSkillIds.size === 0 && skillsForModuleGen.size > 0) {
        throw new Error('Circular dependency detected');
      }

      const currentTransforms = gaps.filter(gap => levelSkillIds.has(gap.skillId));
      const practicalTransforms = currentTransforms.filter(t => !foundationalSkillIds.has(t.skillId));
      const foundationalTransforms = currentTransforms.filter(t => foundationalSkillIds.has(t.skillId));

      pendingFoundationalTransforms.push(...foundationalTransforms);

      if (practicalTransforms.length > 0) {
        const allTransformsForModule = [...pendingFoundationalTransforms, ...practicalTransforms].map(t => Transformation.create(t).props);
        
        const newModule = Module.create({
          id: crypto.randomUUID(),
          name: `Module ${moduleLevel}`,
          transformations: allTransformsForModule,
        });
        modules.push(newModule);

        // Reset pending transformations and increment level
        pendingFoundationalTransforms = [];
        moduleLevel++;
      }
      
      levelSkillIds.forEach(id => skillsForModuleGen.delete(id));
    }

    // If any foundational skills were left over (e.g., a purely theoretical course)
    if (pendingFoundationalTransforms.length > 0) {
        modules.push(Module.create({
            id: crypto.randomUUID(),
            name: `Module ${moduleLevel}`,
            transformations: pendingFoundationalTransforms.map(t => Transformation.create(t).props),
        }));
    }

    return modules;
  }
}
