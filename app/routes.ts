import {
	index,
	layout,
	type RouteConfig,
	route,
} from "@react-router/dev/routes";

export default [
	layout("routes/(main)/layout.tsx", [
		index("routes/(main)/home.tsx"),
		route("checkout", "routes/(main)/checkout/index.tsx"),
	]),
	route("api/set-theme", "routes/api/set-theme.ts"),
] satisfies RouteConfig;
