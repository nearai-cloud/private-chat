import { NEARAI_CLOUD_API_BASE_URL } from '$lib/constants';

export const getModelAttestationReport = async ({
	token,
	model,
	url = NEARAI_CLOUD_API_BASE_URL,
}: GetModelAttestationReportParams): Promise<ModelAttestationReport> => {
	const res = await fetch(
        `${url}/attestation/report?model=${model}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        }
    );
	return res.json();
};

export const getMessageSignature = async (
	{
		token,
		model,
		chatCompletionId,
        url = NEARAI_CLOUD_API_BASE_URL,
		signingAlgorithm = 'ecdsa'
	}: GetMessageSignatureParams
): Promise<MessageSignature> => {
	const res = await fetch(
		`${url}/signature/${chatCompletionId}?model=${model}&signing_algo=${signingAlgorithm}`,
		{
			method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
		}
	);
	return res.json();
};

export type Address = `0x${string}`;

export type GetModelAttestationReportParams = {
	url?: string;
	token: string;
	model: string;
}

export type ModelAttestationReport = {
	signing_address: Address,
	nvidia_payload: string,
	intel_quote: string,
	all_attestations: [
		{
			signing_address: Address,
			nvidia_payload: string,
			intel_quote: string,
		}
	],
}

export type SigningAlgorithm = 'ecdsa';

export type GetMessageSignatureParams = {
	url?: string;
	token: string,
	model: string,
	chatCompletionId: string,   // chatCompletionId from LLM provider in the format of chatcmpl-7b0995f4d1674775877a0532ffe949d9
	signingAlgorithm?: SigningAlgorithm;
}

export type MessageSignature = {
	text: string; // Format: request_body_sha256:response_body_sha256
	signature: string;
	signing_address: Address;
	signing_algo: SigningAlgorithm;
}
