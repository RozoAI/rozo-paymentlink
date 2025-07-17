import { getAddress } from "viem";
import type { QRCodeData } from "./types";

export const DEFAULT_BASE_CHAIN_ID = 8543;

export function parseEthereum(input: string): QRCodeData | null {
	const transferRegex =
		/^ethereum:(0x[a-fA-F0-9]{40})(?:@(\d+))?\/(\w+)\?(.+)$/;
	const match = input.match(transferRegex);

	if (match) {
		const [, contractAddress, chainIdStr, functionName, queryString] = match;

		const params = new URLSearchParams(queryString);
		const recipient = params.get("address");
		const amount = params.get("uint256") || undefined;

		if (!recipient) return null;

		return {
			type: "eip681",
			transfer: {
				protocol: "ethereum",
				contractAddress: getAddress(contractAddress),
				chainId: chainIdStr
					? Number.parseInt(chainIdStr, 10)
					: DEFAULT_BASE_CHAIN_ID,
				functionName: functionName.toLowerCase(),
				recipient: getAddress(recipient),
				amount,
			},
		};
	}

	const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
	if (evmAddressRegex.test(input)) {
		return {
			type: "address",
			transfer: {
				protocol: "ethereum",
				contractAddress: getAddress(
					"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC BASE Contract Address
				),
				chainId: DEFAULT_BASE_CHAIN_ID, // BASE NETWORK
				recipient: getAddress(input),
			},
			message:
				"Detected EVM address. Please make sure you are sending to Base.",
		};
	}

	return null;
}
