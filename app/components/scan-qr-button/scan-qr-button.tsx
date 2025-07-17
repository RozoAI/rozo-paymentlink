import type {
	PaymentCompletedEvent,
	RozoPayOrderView,
} from "@rozoai/intent-common";
import { RozoPayButton } from "@rozoai/intent-pay";
import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Loader2, ScanLine, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { Button } from "~/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "~/components/ui/drawer";

type EIP681Transfer = {
	protocol: string;
	contractAddress: string;
	chainId?: number;
	functionName: string;
	recipient: string;
	amount?: string;
};

type QRCodeType = "website" | "eip681" | "address" | "unknown";

type QRCodeData = {
	type: QRCodeType;
	website?: string;
	transfer?: EIP681Transfer;
	address?: string;
	chainId?: number;
};

interface ScanQRButtonProps {
	appId: string;
}

function parseEIP681Transfer(uri: string): EIP681Transfer | null {
	const regex = /^ethereum:(0x[a-fA-F0-9]{40})(?:@(\d+))?\/(\w+)\?(.+)$/;
	const match = uri.match(regex);

	if (!match) return null;

	const [, contractAddress, chainIdStr, functionName, queryString] = match;
	if (functionName.toLowerCase() !== "transfer") return null;

	const params = new URLSearchParams(queryString);
	const recipient = params.get("address");
	const amount = params.get("uint256") || undefined;

	if (!recipient) return null;

	return {
		protocol: "ethereum",
		contractAddress: contractAddress.toLowerCase(),
		chainId: chainIdStr ? Number.parseInt(chainIdStr, 10) : 8543, // DEFAULT CHAIN ID FOR BASE
		functionName: functionName.toLowerCase(),
		recipient: recipient.toLowerCase(),
		amount,
	};
}

function parseQRCode(qrCode: string): QRCodeData {
	// Check if it's a website URL
	if (qrCode.startsWith("http://") || qrCode.startsWith("https://")) {
		return {
			type: "website",
			website: qrCode,
		};
	}

	// Check if it's an EIP681 transfer
	const transfer = parseEIP681Transfer(qrCode);
	if (transfer) {
		return {
			type: "eip681",
			transfer,
		};
	}

	// Check if it's a plain Ethereum address
	const addressRegex = /^0x[a-fA-F0-9]{40}$/;
	if (addressRegex.test(qrCode)) {
		return {
			type: "address",
			address: qrCode.toLowerCase(),
			chainId: 8543, // Default to Base chain
		};
	}

	// Unknown type
	return {
		type: "unknown",
	};
}

export function ScanQRButton({ appId }: ScanQRButtonProps) {
	const [isScannerOpen, setIsScannerOpen] = useState(false);
	const [_qrCode, setQrCode] = useState<string | null>(null);
	const [parsedTransfer, setParsedTransfer] = useState<EIP681Transfer | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [payment, setPayment] = useState<RozoPayOrderView | null>(null);
	const [_isPaymentOpen, setIsPaymentOpen] = useState(false);
	const [_qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);

	useEffect(() => {
		if (payment) {
			console.log("Payment:", payment);
		}
	}, [payment]);

	const handleScan = (detectedCodes: IDetectedBarcode[]) => {
		if (detectedCodes.length > 0) {
			const result = detectedCodes[0].rawValue;
			setQrCode(result);
			console.log("QR Code scanned:", result);

			// Parse the QR code
			const parsed = parseQRCode(result);
			setQrCodeData(parsed);

			if (parsed.type === "website") {
				// Open website in new tab
				window.open(parsed.website, "_blank");
				setIsScannerOpen(false);
			} else if (parsed.type === "eip681") {
				// Handle EIP681 transfer
				setParsedTransfer(parsed.transfer!);
				console.log("Parsed EIP681 transfer:", parsed.transfer);
			} else if (parsed.type === "address") {
				// Handle plain address - create a transfer object
				const transfer: EIP681Transfer = {
					protocol: "ethereum",
					contractAddress: "0x0000000000000000000000000000000000000000", // ETH
					chainId: parsed.chainId,
					functionName: "transfer",
					recipient: parsed.address!,
					// No amount - user will enter it
				};
				setParsedTransfer(transfer);
				console.log("Parsed address:", parsed.address);
			} else {
				console.log("Unknown QR code type");
			}

			setIsScannerOpen(false);
		}
	};

	const handleCancelPayment = () => {
		setParsedTransfer(null);
		setQrCodeData(null);
		setIsScannerOpen(false);
	};

	return (
		<>
			{!parsedTransfer && (
				<Drawer open={isScannerOpen} onOpenChange={setIsScannerOpen}>
					<DrawerTrigger asChild className="m-auto w-full">
						<Button className="py-8 text-lg">
							<ScanLine className="size-7" />
							Scan QR Code
						</Button>
					</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Scan QR Code</DrawerTitle>
						</DrawerHeader>
						<div className="p-4">
							<div className="mx-auto w-full max-w-sm">
								<div className="h-80 w-full overflow-hidden rounded-lg border border-border">
									<Scanner
										onScan={handleScan}
										onError={(error) => {
											console.error("Scanner error:", error);
										}}
										sound={false}
									/>
								</div>
								<p className="mt-4 text-center text-muted-foreground text-sm">
									Position the QR code within the scanner frame
								</p>
							</div>
						</div>
					</DrawerContent>
				</Drawer>
			)}

			{/* Display parsed transfer information */}
			{parsedTransfer && (
				<RozoPayButton.Custom
					defaultOpen={!!parsedTransfer}
					appId={appId}
					toAddress={getAddress(parsedTransfer.recipient)}
					toChain={Number(parsedTransfer.chainId)}
					{...(parsedTransfer.amount && {
						toUnits: parsedTransfer.amount,
					})}
					toToken={getAddress(parsedTransfer.contractAddress)}
					onOpen={() => {
						setIsPaymentOpen(true);
					}}
					onPaymentStarted={() => {
						setIsLoading(true);
					}}
					onPaymentBounced={() => {
						setIsLoading(false);
					}}
					onPaymentCompleted={(args: PaymentCompletedEvent) => {
						setPayment(args.payment);
						setIsLoading(false);
						setParsedTransfer(null);
						setQrCodeData(null);
					}}
				>
					{({ show }) => (
						<div className="m-auto flex w-full flex-col gap-2">
							<Button
								className="w-full py-8 text-lg"
								size={"lg"}
								onClick={show}
								disabled={isLoading}
							>
								{isLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<>
										<Wallet />
										Pay with Crypto
									</>
								)}
							</Button>

							<Button
								variant="outline"
								className="w-full py-8 text-lg"
								size={"lg"}
								onClick={handleCancelPayment}
								disabled={isLoading}
							>
								Cancel Payment
							</Button>
						</div>
					)}
				</RozoPayButton.Custom>
			)}
		</>
	);
}
