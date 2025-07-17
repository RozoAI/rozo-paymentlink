import { Outlet } from "react-router";
import FabActions from "~/components/fab-actions/fab-actions";
import Footer from "~/components/footer/footer";
import { Toaster } from "~/components/ui/sonner";
import { Providers } from "~/lib/providers";

export function meta() {
	return [
		{ title: "Rozo | One Tap to Pay" },
		{ name: "description", content: "Increase the GDP of Crypto" },
	];
}

export default function Layout() {
	return (
		<Providers>
			<main className="flex h-full flex-col gap-4 md:min-h-screen md:items-center md:justify-center md:py-4">
				<Outlet />
				<Footer className="mt-auto py-8" />
				<FabActions />
				<Toaster position="top-center" />
			</main>
		</Providers>
	);
}
