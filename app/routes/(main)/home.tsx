import { data, useLoaderData } from "react-router";
import { Theme, useTheme } from "remix-themes";
import BoxedCard from "~/components/boxed-card/boxed-card";
import { ScanQRButton } from "~/components/scan-qr-button/scan-qr-button";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { CardContent } from "~/components/ui/card";
import { env } from "~/lib/env.server";

/**
 * Type for the loader data
 */
type LoaderData = {
	success: boolean;
	appId?: string;
};

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

				{loaderData.appId && <ScanQRButton appId={loaderData.appId} />}
			</CardContent>
		</BoxedCard>
	);
}
