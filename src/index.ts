import { handleRequest } from './handleRequest';
import { Env } from './EnvType';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// Process the request and create a response
		const response = await handleRequest(request, env, ctx);

		// Set CORS headers
		response.headers.set("Access-Control-Allow-Origin", "*");
		response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		response.headers.set("Access-Control-Allow-Headers", "Content-Type");

		// return response
		return response;
	}
};
