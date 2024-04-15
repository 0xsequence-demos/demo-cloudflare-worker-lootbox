import { networks, findSupportedNetwork, toChainIdNumber, NetworkConfig } from '@0xsequence/network'
import { ethers } from 'ethers'
import { Session, SessionSettings } from '@0xsequence/auth'

export interface Env {
	DEV: boolean;
	CLIENT_URL: string;
	CHAIN_HANDLE: string;
	PKEY: string;
	ADMIN: string;
	CONTRACT_ADDRESS: string;
	DAILY_MINT_RESTRICTION: number;
	SCENARIO_MODEL_ID: string;
	SCENARIO_API_KEY: string;
	ACCESS_KEY_ID: string;
	PROJECT_ID: number;
	COLLECTION_ID: string;
	PROJECT_ACCESS_KEY: string;
	PROJECT_ACCESS_KEY_DEV: string;
	PROJECT_ACCESS_KEY_PROD: string;
	JWT_ACCESS_KEY: string;
}

const ProcessInferencePool = (base: any) => {
	base.generate = async () => {
		const url = 'https://flask-production-2641.up.railway.app/'; // External API endpoint
		
		const init = {
			method: 'GET',
			headers: {
			'Content-Type': 'application/json',
			},
		};

		const response = await fetch(url, init); // Fetch data from external API
		const data: any= await response.json(); 

	  	const attributes = []
	  	const defend = Math.random() >= 0.5 ? true : false

		// category
		attributes.push({
		  display_type: "category",
		  trait_type: "Category",
		  value: data[defend ? 'armor' : 'weapon'].category
		})

		// main stats
		attributes.push(...base.formatStatString(data[defend ? 'armor' : 'weapon'].main_stats[0], true))

		// sub stats
		const sub_stats = data[defend ? 'armor' : 'weapon'].stats

		// tier
		sub_stats.map((stats: any) => {
		  attributes.push(...base.formatStatString(stats, false))
		})

		// type
		attributes.push({
		  display_type: "tier",
		  trait_type: "tier",
		  value: data[defend ? 'armor' : 'weapon'].tier
		})

		attributes.push({
		  display_type: "type",
		  trait_type: "type",
		  value: data[defend ? 'armor' : 'weapon'].type
		})
		
		return {loot: data[defend ? 'armor' : 'weapon'], attributes: attributes}
	}
	return {
		...base
	}
}

const Strings = (base: any) => {
	base.toSnakeCase = (str: any) => {
		return str.toLowerCase().replace(/\s+/g, '_');
	}

	base.removeCharacter = (str: any, charToRemove: any)=>{
		return str.replace(new RegExp(charToRemove, 'g'), '');
	}

	base.formatStatString = (str: any, main = true) => {
		if(str == null ) return []
		const regex = /^(.*?)\s*([+-]?\d+)(-)?(\d+)?(%?)$/;
		const matches = str.match(regex);
		let formattedResult = [];
	  
		if (matches) {
			let [_, stat_name, firstValue, rangeIndicator, secondValue, percentageSymbol] = matches;
			stat_name = base.removeCharacter(stat_name, ':')
			const baseDisplayType = base.toSnakeCase(stat_name);
			const isPercentage = percentageSymbol === '%';
	  
			if (rangeIndicator === '-') {
				formattedResult.push({
					"display_type": main ? baseDisplayType + "_min" : "sub_stats_"+baseDisplayType + "_min", 
					"trait_type": stat_name + " Minimum", 
					"value": parseInt(firstValue, 10) + (isPercentage ? '%' : '')
				});
	  
				formattedResult.push({
					"display_type": main ? baseDisplayType + "_max" : "sub_stats_"+baseDisplayType + "_max", 
					"trait_type": stat_name + " Maximum", 
					"value": parseInt(secondValue, 10) + (isPercentage ? '%' : '')
				});
			} else {
				formattedResult.push({
					"display_type": main ? baseDisplayType : "sub_stats_"+baseDisplayType, 
					"trait_type": stat_name, 
					"value": parseInt(firstValue, 10) + (isPercentage ? '%' : '')
				});
			}
		} 
	  
		return formattedResult;
	  }
	return base;
};

const Time = (base: any) => {
	return {
		...base, 
		wait: async (ms: any) => new Promise((res) => setTimeout(res, ms)),
		getCurrentSecond: () => {
			const now = new Date()
			return now.getSeconds()
		}
	}
}

const Upload = (base: any) => {
	base.uploadAsset = async (projectID: any, collectionID: any, assetID: any, tokenID: any, url: any) => {
		
		// TODO: fetch media url

		// TODO: create form data from file blob
	  
		let METADATA_URL;
		if(base.env.DEV){
			METADATA_URL = 'https://dev-metadata.sequence.app'
		} else {
			METADATA_URL = 'https://metadata.sequence.app'
		}

		// Construct the endpoint URL
		const endpointURL = `${METADATA_URL}/projects/${projectID}/collections/${collectionID}/tokens/${tokenID}/upload/${assetID}`;

		try {
			// TODO: upload media asset

			return {};
		}catch(err: any){
			console.log(err)
			throw new Error(err)
		}
	}

	return {
		...base,
		upload: async (name: any, attributes: any, imageUrl: any) => {
			let METADATA_URL;

			if(base.env.DEV){
				METADATA_URL = 'https://dev-metadata.sequence.app'
			} else {
				METADATA_URL = 'https://metadata.sequence.app'
			}

			try{
				const myHeaders = new Headers();
				myHeaders.append("Content-Type", "application/json");
				myHeaders.append("Authorization", `Bearer ${base.env.JWT_ACCESS_KEY}`);
				
				const collectionID = base.env.COLLECTION_ID
				const projectID = base.env.PROJECT_ID

				// assign a randomNonceSpace as tokenID
				const randomTokenIDSpace = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(20)))

				// TODO: create token

				// TODO: create asset

				// TODO: upload asset

				// TODO: update token to not be private

				return {url: 'https://', tokenID: String(randomTokenIDSpace)}
			}catch(err){
				console.log(err)
			}
		},
	}
	return base;
};

const Inference = (base: any) => {
	return {
		...base,
		getInferenceWithItem: async (prompt: any) => {
			return new Promise( async (res) => {
				// TODO: implement performing an inference on the prompt
				res({})
			})
		  },
		 getInferenceStatus: (id: any) => {
			return new Promise(async (res) => {

				console.log('getting inference status for: ',id.inferenceId)
				const inferenceId = id.inferenceId
				// const authHeader = 'Basic ' + base64.encode(`${key}:${secret}`);
				const headers = {
					'Authorization': `Basic ${base.env.SCENARIO_API_KEY}`,
					'accept': 'application/json',
					'content-type': 'application/json'
				}

				// Function to poll the inference status
				const pollInferenceStatus = async (res: any) => {
					// TODO: implement polling on status of response
					res({})
				};

				// Start polling the inference status
				await pollInferenceStatus(res);
			})
		  }
	}
}

async function handleRequest(request: any, env: Env, ctx: ExecutionContext) {

		// handle pre-request call
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					// Allow requests from any origin - adjust this as necessary
					"Access-Control-Allow-Origin": "*",
					
					// Allows the headers Content-Type, your-custom-header
					"Access-Control-Allow-Headers": "Content-Type, your-custom-header",
					
					// Allow POST method - add any other methods you need to support
					"Access-Control-Allow-Methods": "POST",
					
					// Optional: allow credentials
					"Access-Control-Allow-Credentials": "true",
					
					// Preflight cache period
					"Access-Control-Max-Age": "86400", // 24 hours
				}
			});
		}

		try {

			// TODO: (optional) implement address restriction

			// assign the correct project access key based on the environment
			if(env.DEV) env.PROJECT_ACCESS_KEY = env.PROJECT_ACCESS_KEY_DEV
			else env.PROJECT_ACCESS_KEY = env.PROJECT_ACCESS_KEY_PROD

			const payload = await request.json()
			const { address, tokenID, mint }: any = payload

			let lootbox = ProcessInferencePool(
				Inference(
					Time(
						Strings(
							Upload(
								{
									env: env
								}
							)
						)
					)
				)
			)

			if(mint){
				try {
					// TODO: implement a callContract requst to mint token
					const txn = await callContract(env, env.CONTRACT_ADDRESS, address, tokenID)
					return new Response(JSON.stringify({txnHash: txn}), { status: 200 })
				} catch(error: any) {
					return new Response(JSON.stringify(error), { status: 400 })
				}
			} else {
				const loot = await lootbox.generate()
				// TODO: get inference with item
				// TODO: poll to get inference status with id
				// TODO: upload loot and media
				return new Response(JSON.stringify({loot: loot, image: 'https://', name: 'lootbox item', tokenID: '0'}), { status: 200 });
			}
		} catch (error) {
			console.log(error)
			return new Response('Error', { status: 500 }); // Handle errors
		}
}

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

const callContract = async (env: Env, collectibleAddress: string, address: string, tokenID: number): Promise<ethers.providers.TransactionResponse> => {
	const chainConfig: any = findSupportedNetwork(env.CHAIN_HANDLE)

	const provider = new ethers.providers.StaticJsonRpcProvider({
		url: chainConfig.rpcUrl, 
		skipFetchSetup: true // Required for ethers.js Cloudflare Worker support
	})

	const walletEOA = new ethers.Wallet(env.PKEY, provider);
	const relayerUrl = `https://${chainConfig.name}-relayer.sequence.app`

	// TODO: implement relayer transaction

	try {
		return '0x' as any
	} catch (err) {
		console.error(`ERROR: ${err}`)
		throw err
	}
}