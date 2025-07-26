import { WEBUI_BASE_URL } from '$lib/constants';

export const getModelAttestationReport = async (
    token: string,
	model: string,
	url: string = `${WEBUI_BASE_URL}/api`
) => {
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
    token: string,
	chatId: string,
	model: string,
	url: string = `${WEBUI_BASE_URL}/api`,
	signingAlgorithm: string = 'ecdsa'
) => {
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
