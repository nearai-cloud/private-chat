import { NEARAI_CLOUD_API_BASE_URL } from '$lib/constants';

export const getModelAttestationReport = async ({
	url = NEARAI_CLOUD_API_BASE_URL,
	token,
	model,
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
		url,
		token,
		model,
		chatId,
		signingAlgorithm = 'ecdsa'
	}: GetMessageSignatureParams
): Promise<MessageSignature> => {
	const res = await fetch(
		`${url}/signature/${chatId}?model=${model}&signing_algo=${signingAlgorithm}`,
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
	chatId: string,
	signingAlgorithm?: SigningAlgorithm;
}

export type MessageSignature = {
	text: string; // Format: request_body_sha256:response_body_sha256
	signature: string;
	signing_algo: SigningAlgorithm;
}
