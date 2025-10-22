import { WEBUI_BASE_URL } from '$lib/constants';

export const getModelAttestationReport = async ({
	token,
	model,
	url = `${WEBUI_BASE_URL}/api`
}: GetModelAttestationReportParams): Promise<ModelAttestationReport> => {
	const res = await fetch(`${url}/attestation/report?model=${encodeURIComponent(model)}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/json'
		}
	});
	const data = await res.json();
	if (!data.model_attestations) {
		data.model_attestations = data.all_attestations || [];
	}
	return data;
};

export const getMessageSignature = async ({
	token,
	model,
	chatCompletionId,
	url = `${WEBUI_BASE_URL}/api`,
	signingAlgorithm = 'ecdsa'
}: GetMessageSignatureParams): Promise<MessageSignature> => {
	const res = await fetch(
		`${url}/signature/${encodeURIComponent(chatCompletionId)}?model=${encodeURIComponent(model)}&signing_algo=${encodeURIComponent(signingAlgorithm)}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json'
			}
		}
	);
	return res.json();
};

export type Address = `0x${string}`;

export type GetModelAttestationReportParams = {
	url?: string;
	token: string;
	model: string;
};

export type ModelAttestationReport = {
	gateway_attestation: {
		quote: string;
		event_log: string;
	};
	model_attestations: Array<{
		signing_address: Address;
		nvidia_payload: string;
		intel_quote: string;
	}>;
};

export type SigningAlgorithm = 'ecdsa';

export type GetMessageSignatureParams = {
	url?: string;
	token: string;
	model: string;
	chatCompletionId: string; // chatCompletionId from LLM provider in the format of chatcmpl-7b0995f4d1674775877a0532ffe949d9
	signingAlgorithm?: SigningAlgorithm;
};

export type MessageSignature = {
	text: string; // Format: request_body_sha256:response_body_sha256
	signature: string;
	signing_address: Address;
	signing_algo: SigningAlgorithm;
};
