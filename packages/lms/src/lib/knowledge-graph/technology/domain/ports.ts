import { createPort } from '@sota/core/di';
import { Language } from './entities/language.entity';
import { Runtime } from './entities/runtime.entity';
import { Framework } from './entities/framework.entity';
import { Specialization } from './entities/specialization.entity';

// Language Ports
export const saveLanguagePort = createPort<(entity: Language) => Promise<void>>();

// Runtime Ports
export const saveRuntimePort = createPort<(entity: Runtime) => Promise<void>>();

// Framework Ports
export const saveFrameworkPort = createPort<(entity: Framework) => Promise<void>>();

// Specialization Ports
export const saveSpecializationPort = createPort<(entity: Specialization) => Promise<void>>();
export const findSpecializationByNamePort = createPort<(name: string) => Promise<Specialization | null>>();
