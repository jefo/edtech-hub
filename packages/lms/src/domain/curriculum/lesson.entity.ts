import { z } from 'zod';
import { createEntity } from '@sota/core/entity';

const LessonPropsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  // For now, content is just text. Could be expanded to support markdown, video URLs, etc.
  content: z.string(),
  // Each lesson is directly linked to the skill it teaches.
  skillId: z.string().uuid(),
});

export type LessonProps = z.infer<typeof LessonPropsSchema>;

export const Lesson = createEntity({
  schema: LessonPropsSchema,
  actions: {
    updateContent: (state: LessonProps, newContent: string) => {
        return { ...state, content: newContent };
    },
  },
});

export type Lesson = InstanceType<typeof Lesson>;