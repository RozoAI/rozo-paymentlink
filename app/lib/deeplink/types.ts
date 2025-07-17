export interface EIP681Transfer {
	protocol: "ethereum" | "solana" | "stellar";
	contractAddress: string;
	recipient: string;
	chainId?: number;
	functionName?: string;
	amount?: string;
}

export type QRCodeType =
	| "website"
	| "eip681"
	| "address"
	| "solana"
	| "stellar"
	| "unknown";

export interface QRCodeData {
	type: QRCodeType;
	website?: string;
	transfer?: EIP681Transfer;
	address?: string;
	chainId?: number;
	message?: string;
}
