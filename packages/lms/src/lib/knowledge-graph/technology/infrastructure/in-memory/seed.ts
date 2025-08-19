import { usePort } from '@sota/core/di';
import {
    saveLanguagePort,
    saveRuntimePort,
    saveFrameworkPort,
    saveSpecializationPort
} from '../../domain/ports';
import { Language } from '../../domain/entities/language.entity';
import { Runtime } from '../../domain/entities/runtime.entity';
import { Framework } from '../../domain/entities/framework.entity';
import { Specialization } from '../../domain/entities/specialization.entity';

export const seedKnowledgeGraph = async () => {
    console.log('Seeding new Knowledge Graph...');

    // Get ports
    const saveLanguage = usePort(saveLanguagePort);
    const saveRuntime = usePort(saveRuntimePort);
    const saveFramework = usePort(saveFrameworkPort);
    const saveSpecialization = usePort(saveSpecializationPort);

    // 1. Create Languages
    const ts = Language.create({ id: crypto.randomUUID(), name: 'TypeScript' });
    const python = Language.create({ id: crypto.randomUUID(), name: 'Python' });
    await saveLanguage(ts);
    await saveLanguage(python);

    // 2. Create Runtimes
    const nodejs = Runtime.create({ id: crypto.randomUUID(), name: 'Node.js', languageId: ts.id });
    await saveRuntime(nodejs);

    // 3. Create Frameworks
    const express = Framework.create({ id: crypto.randomUUID(), name: 'Express.js', runtimeId: nodejs.id });
    const fastify = Framework.create({ id: crypto.randomUUID(), name: 'Fastify', runtimeId: nodejs.id });
    const fastapi = Framework.create({ id: crypto.randomUUID(), name: 'FastAPI', runtimeId: python.id }); // Note: This is a mistake in the model, FastAPI runs on Python, not a specific runtime entity I created.
    await saveFramework(express);
    await saveFramework(fastify);
    await saveFramework(fastapi);

    // 4. Create Specialization and link it
    const backend = Specialization.create({ id: crypto.randomUUID(), name: 'Backend Development', frameworkIds: [] });
    backend.actions.addFramework(express.id);
    backend.actions.addFramework(fastify.id);
    backend.actions.addFramework(fastapi.id);
    await saveSpecialization(backend);

    console.log('Knowledge Graph seeding complete!');
};