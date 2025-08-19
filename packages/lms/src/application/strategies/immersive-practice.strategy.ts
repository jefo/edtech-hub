import { LearningObjective } from '@lms/domain/curriculum/learning-objective.vo';
import { Module } from '@lms/domain/curriculum/module.entity';
import { Lesson } from '@lms/domain/curriculum/lesson.entity';
import { Skill } from '@lms/domain/skill/skill.aggregate';
import { TransformationProps } from '@lms/domain/curriculum/transformation.vo';
import { ICurriculumSequencingStrategy } from './sequencing.strategy';

export class ImmersivePracticeStrategy implements ICurriculumSequencingStrategy {
  sequence(gaps: TransformationProps[], skills: Map<string, Skill>): ModuleProps[] {
    const modules: ModuleProps[] = [];
    const skillsForModuleGen = new Set(skills.keys());
    let moduleLevel = 1;

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
        const allTransformsForModule = [...pendingFoundationalTransforms, ...practicalTransforms];
        const lessons = allTransformsForModule.map((t, i) => {
            const skillName = skills.get(t.skillId)?.state.name || 'Unknown Skill';
            return Lesson.create({
                id: crypto.randomUUID(),
                name: `Intro to ${skillName}`,
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

        pendingFoundationalTransforms = [];
        moduleLevel++;
      }
      
      levelSkillIds.forEach(id => skillsForModuleGen.delete(id));
    }

    if (pendingFoundationalTransforms.length > 0) {
        const lessons = pendingFoundationalTransforms.map((t, i) => {
            const skillName = skills.get(t.skillId)?.state.name || 'Unknown Skill';
            return Lesson.create({
                id: crypto.randomUUID(),
                name: `Intro to ${skillName}`,
                sequence: i + 1,
                transformation: t,
                learningObjectives: [LearningObjective.create({ description: `Understand the core concepts of ${skillName}` }).props],
            }).props;
        });
        modules.push(Module.create({
            id: crypto.randomUUID(),
            name: `Module ${moduleLevel}`,
            lessons: lessons,
        }).props);
    }

    return modules;
  }
}
