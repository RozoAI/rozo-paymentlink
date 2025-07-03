export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="w-full py-4 text-center text-muted-foreground text-sm">
			<p>Rozo Pay &copy; {currentYear}</p>
		</footer>
	);
}
