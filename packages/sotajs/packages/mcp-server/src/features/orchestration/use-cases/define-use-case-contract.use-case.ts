import { z } from "zod";
import { usePort } from "@sota/core/di";
import {
	findFeatureSliceByIdPort,
	saveFeatureSlicePort,
} from "../domain/ports";
import { withValidation } from "@sota/core/validation";

const DefineUseCaseContractInputSchema = z.object({
	featureSliceId: z.string().uuid(),
	useCaseName: z.string(),
	inputDto: z.string(),
	outputDto: z.string(),
	ports: z.array(z.string()),
});

async function handleDefineUseCaseContract(
	input: z.infer<typeof DefineUseCaseContractInputSchema>,
) {
	const findFeatureSliceById = usePort(findFeatureSliceByIdPort);
	const saveFeatureSlice = usePort(saveFeatureSlicePort);

	const { featureSliceId, ...contract } = input;

	// 1. Load the aggregate
	const slice = await findFeatureSliceById(featureSliceId);
	if (!slice) {
		throw new Error(`FeatureSlice with ID ${featureSliceId} not found.`);
	}

	// 2. Call the aggregate's method to update its state
	slice.defineUseCaseContract(contract);

	// 3. Persist the updated aggregate
	await saveFeatureSlice(slice);

	return { success: true, featureSliceId };
}

export const defineUseCaseContractUseCase = withValidation(
	handleDefineUseCaseContract,
	DefineUseCaseContractInputSchema,
);
