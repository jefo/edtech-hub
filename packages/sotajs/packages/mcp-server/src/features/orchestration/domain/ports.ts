import { createPort } from '@sota/core/di';
import { FeatureSlice } from './feature-slice.aggregate';

export const saveFeatureSlicePort = createPort<(slice: FeatureSlice) => Promise<void>>();

export const findFeatureSliceByIdPort = createPort<(id: string) => Promise<FeatureSlice | null>>();

export const renderFeatureSlicePort = createPort<(slice: FeatureSlice) => Promise<{ filePath: string; content: string }[]>>();
