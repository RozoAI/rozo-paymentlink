import type {
	PaymentCompletedEvent,
	RozoPayOrderView,
} from "@rozoai/intent-common";
import { RozoPayButton } from "@rozoai/intent-pay";
import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Loader2, ScanLine, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { data, useLoaderData } from "react-router";
import { Theme, useTheme } from "remix-themes";
import { getAddress } from "viem";
import BoxedCard from "~/components/boxed-card/boxed-card";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { CardContent } from "~/components/ui/card";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "~/components/ui/drawer";
import { env } from "~/lib/env.server";

type EIP681Transfer = {
	protocol: string;
	contractAddress: string;
	chainId?: number;
	functionName: string;
	recipient: string;
	amount?: string; // now optional
};

/**
 * Type for the loader data
 */
type LoaderData = {
	success: boolean;
	appId?: string;
};

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

/**
 * Loader function to fetch payment data from Daimo API
 */
export async function loader() {
	return data({
		success: true,
		appId: env.DAIMO_API_KEY,
	});
}

export default function Home() {
	const loaderData = useLoaderData<typeof loader>() as LoaderData;

	const [theme] = useTheme();
	const [isScannerOpen, setIsScannerOpen] = useState(false);
	const [_qrCode, setQrCode] = useState<string | null>(null);
	const [parsedTransfer, setParsedTransfer] = useState<EIP681Transfer | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [payment, setPayment] = useState<RozoPayOrderView | null>(null);
	const [_isPaymentOpen, setIsPaymentOpen] = useState(false);

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

			// Parse EIP681 transfer if it's an Ethereum URI
			const transfer = parseEIP681Transfer(result);
			if (transfer) {
				setParsedTransfer(transfer);
				console.log("Parsed EIP681 transfer:", transfer);
			} else {
				setParsedTransfer(null);
				console.log("Not an EIP681 transfer URI");
			}

			setIsScannerOpen(false);
		}
	};

	const handleCancelPayment = () => {
		setParsedTransfer(null);
		setIsScannerOpen(false);
	};

	return (
		<BoxedCard>
			<CardContent className="flex flex-1 flex-col items-center justify-center pt-6 md:pt-0">
				<div className="mb-2 flex flex-col items-center justify-center gap-1">
					<Avatar className="size-8 rounded-none">
						<AvatarImage
							src={theme === Theme.DARK ? "/logo-white.png" : "/logo.png"}
							alt="Rozo Pay"
						/>
					</Avatar>
					<span className="font-bold text-foreground text-xl ">Rozo Pay</span>
				</div>

				<p className="my-4 text-center text-lg">
					Experience effortless, secure crypto payments with Rozo Pay. Our
					platform makes digital transactions fast, reliable, and accessible to
					everyone. Start accepting and sending crypto with confidence—no
					technical expertise required.
				</p>

				{!parsedTransfer && (
					<Drawer open={isScannerOpen} onOpenChange={setIsScannerOpen}>
						<DrawerTrigger asChild>
							<Button className="w-full" size={"lg"}>
								<ScanLine />
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
						appId={loaderData.appId ?? ""}
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
						}}
					>
						{({ show }) => (
							<div className="flex w-full flex-col gap-2">
								<Button
									variant="default"
									className="w-full"
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
									className="w-full"
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
			</CardContent>
		</BoxedCard>
	);
}
