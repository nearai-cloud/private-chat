import * as secp256k1 from '@noble/secp256k1';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import { keccak_256 } from '@noble/hashes/sha3';

export function verifySignature(address: string, message: string, signature: string) {
	try {
		const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
		let msgBytes: Uint8Array;
		if (/^[0-9a-fA-F]+$/.test(message) && message.length % 2 === 0) {
			msgBytes = hexToBytes(message.startsWith('0x') ? message.slice(2) : message);
		} else {
			msgBytes = new TextEncoder().encode(message);
		}
		const sigBytes = hexToBytes(sig);
		if (sigBytes.length !== 65) return false;
		const r = sigBytes.slice(0, 32);
		const s = sigBytes.slice(32, 64);
		const v = sigBytes[64];

		const prefix = `\x19Ethereum Signed Message:\n${msgBytes.length}`;
		const prefixBytes = new TextEncoder().encode(prefix);
		const concat = new Uint8Array(prefixBytes.length + msgBytes.length);
		concat.set(prefixBytes, 0);
		concat.set(msgBytes, prefixBytes.length);
		const msgHash = keccak_256(concat);
		if (v !== 27 && v !== 28) return false;
		const recovery = v - 27;
		const compactSig = new Uint8Array([...r, ...s]);
		let pub;
		try {
			pub = secp256k1.Signature.fromCompact(compactSig)
				.addRecoveryBit(recovery)
				.recoverPublicKey(msgHash)
				.toRawBytes(false);
		} catch {
			return false;
		}
		if (!pub) return false;

		const pubkey = pub.slice(1);
		const addrHash = keccak_256(pubkey);
		const recovered = '0x' + bytesToHex(addrHash.slice(-20)).toLowerCase();
		return recovered === address.toLowerCase();
	} catch (error) {
		console.error('failed:', error);
		return false;
	}
}
