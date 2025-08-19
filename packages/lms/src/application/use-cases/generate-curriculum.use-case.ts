import { z } from 'zod';
import { usePort } from '@sota/core/di';
import { SkillTree } from '@lms/domain/skill/skill-tree.vo';
import { Curriculum } from '@lms/domain/curriculum/curriculum.aggregate';
import { Module } from '@lms/domain/curriculum/module.entity';
import { Lesson } from '@lms/domain/curriculum/lesson.entity';
import { saveCurriculumPort, saveModulePort, saveLessonPort } from '@lms/domain/curriculum/ports';

export const GenerateCurriculumInputSchema = z.object({
  title: z.string().min(1),
  skillTree: z.custom<SkillTree>(),
});
export type GenerateCurriculumInput = z.infer<typeof GenerateCurriculumInputSchema>;

export const generateCurriculumUseCase = async (input: GenerateCurriculumInput) => {
  const { title, skillTree } = GenerateCurriculumInputSchema.parse(input);

  const saveCurriculum = usePort(saveCurriculumPort);
  const saveModule = usePort(saveModulePort);
  const saveLesson = usePort(saveLessonPort);

  const lessons: Lesson[] = [];
  const modules: Module[] = [];

  // Create one Module and one Lesson per Skill in the provided tree.
  for (const skill of skillTree.props.skills) {
    const lesson = Lesson.create({
      id: crypto.randomUUID(),
      title: `Урок: ${skill.name}`,
      content: skill.description || `Материалы для изучения "${skill.name}".`,
      skillId: skill.id,
    });
    lessons.push(lesson);
    await saveLesson(lesson);

    const module = Module.create({
      id: crypto.randomUUID(),
      title: `Модуль: ${skill.name}`,
      lessonIds: [lesson.state.id],
    });
    modules.push(module);
    await saveModule(module);
  }

  // For now, the module order is not determined by prerequisites.
  // This can be a separate step or a more advanced feature.
  const moduleIds = modules.map(m => m.state.id);
  
  if (moduleIds.length === 0) {
      throw new Error("Cannot create an empty curriculum. The skill tree must contain skills.");
  }

  const curriculum = Curriculum.create({
    id: crypto.randomUUID(),
    title: title,
    moduleIds: moduleIds,
  });
  await saveCurriculum(curriculum);

  return {
    curriculumId: curriculum.state.id,
    moduleCount: modules.length,
    lessonCount: lessons.length,
  };
};
