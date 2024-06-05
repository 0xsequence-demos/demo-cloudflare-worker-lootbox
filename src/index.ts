import { networks, findSupportedNetwork, NetworkConfig } from '@0xsequence/network'
import { ethers } from 'ethers'
import { Session, SessionSettings } from '@0xsequence/auth'
import { SequenceCollections } from '@0xsequence/metadata'

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

interface Loot {
    loot: any;
    attributes: any;
}

class TimeUtils {
    static wait = async (ms: any) => new Promise((res) => setTimeout(res, ms))
    
    static getCurrentSecond = () => {
        const now = new Date()
        return now.getSeconds()
    }
}

class StringUtils {
    static toSnakeCase = (str: any) => {
        return str.toLowerCase().replace(/\s+/g, '_');
    }
    
    static removeCharacter = (str: any, charToRemove: any)=>{
        return str.replace(new RegExp(charToRemove, 'g'), '');
    }

    static capitalizeFirstWord(str: any) {
        // Check if the string is not empty
        if (str.length === 0) return str;
        
        // Convert the first character to uppercase and concatenate the rest of the string
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    static formatStatString = (str: any, main = true) => {
        if(str == null ) return []
        const regex = /^(.*?)\s*([+-]?\d+)(-)?(\d+)?(%?)$/;
        const matches = str.match(regex);
        let formattedResult = [];
      
        if (matches) {
            let [_, stat_name, firstValue, rangeIndicator, secondValue, percentageSymbol] = matches;
            stat_name = StringUtils.removeCharacter(stat_name, ':')
            const baseDisplayType = StringUtils.toSnakeCase(stat_name);
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
};

const generateLoot = async (): Promise<Loot> => {
    try {
        const url = 'https://flask-production-2641.up.railway.app/'; // External API for generating loot attributes
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data: any = await response.json(); 
        console.log(data)
        const attributes = []
        const defend = Math.random() >= 0.5 ? true : false

        // category
        attributes.push({
          display_type: "category",
          trait_type: "Category",
          value: data[defend ? 'armor' : 'weapon'].category
        })

        // main stats
        attributes.push(StringUtils.formatStatString(data[defend ? 'armor' : 'weapon'].main_stats[0], true))

        // sub stats
        const sub_stats = data[defend ? 'armor' : 'weapon'].stats

        // tier
        sub_stats.map((stats: any) => {
          attributes.push(StringUtils.formatStatString(stats, false))
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
        
        return {
            loot: data[defend ? 'armor' : 'weapon'], 
            attributes: attributes
        }
    } catch(err: any) {
        console.log(err)
        throw new Error(err)
    }
}

const Upload = (base: any) => {
    base.uploadAsset = async (projectID: any, collectionID: any, assetID: any, tokenID: any, url: any) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch file from ${url}: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer]);

        const formData = new FormData();
        
        formData.append('file', blob, `image.png`); // You might want to dynamically determine the filename
      
        let METADATA_URL;

        if(base.env.DEV){
            METADATA_URL = 'https://dev-metadata.sequence.app'
        } else {
            METADATA_URL = 'https://metadata.sequence.app'
        }

        // TODO
        // const collectionsService = new SequenceCollections(METADATA_URL, base.env.JWT_ACCESS_KEY)

        // Construct the endpoint URL
        const endpointURL = `${METADATA_URL}/projects/${projectID}/collections/${collectionID}/tokens/${tokenID}/upload/${assetID}`;

        try {
          // Use fetch to make the request
          const fetchResponse = await fetch(endpointURL, {
            method: 'PUT',
            body: formData,
            headers: {
              'Authorization': `Bearer ${base.env.JWT_ACCESS_KEY}`, // Put your token here
            },
          });
      
          // Assuming the response is JSON
          const data = await fetchResponse.json();

          return data;
        }catch(err){
            console.log('error uploading image')
            console.log(err)
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

            try {
                
                const collectionsService = new SequenceCollections(METADATA_URL, base.env.JWT_ACCESS_KEY)

                const collectionID = base.env.COLLECTION_ID
                const projectID = base.env.PROJECT_ID

                // tokenID
                const randomTokenIDSpace = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(20)))

                try {
                    const res1 = await collectionsService.createToken({
                        projectId: projectID,
                        collectionId: collectionID,
                        token: {
                            tokenId: String(randomTokenIDSpace),
                            name: name,
                            description: "A free lootbox mini-game available for use in any game that requires collectible rewards",
                            decimals: 0,
                            attributes: attributes
                        }
                    })
    
                } catch(err){
                    console.log('error creating token')
                    console.log(err)
                }

                let res2;

                try {
                    res2 = await collectionsService.createAsset({
                        projectId: projectID,
                        asset: {
                            id: Number(String(randomTokenIDSpace).slice(0,10)),
                            collectionId: collectionID,
                            tokenId: String(randomTokenIDSpace),
                            metadataField: "image"
                        }
                    })
                } catch(err){
                    console.log('error creating asset')
                    console.log(err)
                }

                // upload asset
                const uploadAssetRes = await base.uploadAsset(projectID, collectionID, res2.asset.id, String(randomTokenIDSpace), imageUrl)

                return {url: uploadAssetRes.url, tokenID: String(randomTokenIDSpace)}
            }catch(err){
                console.log(err)
                throw new Error('Sequence Metadata Service Fail')
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
                fetch(`https://api.cloud.scenario.com/v1/models/${base.env.SCENARIO_MODEL_ID}/inferences`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${base.env.SCENARIO_API_KEY}`,
                        'accept': 'application/json',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                                "parameters": {
                                "numSamples": 1,
                                "qualityBoostScale": 4,
                                "qualityBoost": false,
                                "type": "txt2img",
                                "disableMerging": false,
                                "hideResults": false,
                                "referenceAdain": false,
                                "intermediateImages": false,
                                "scheduler": 'EulerDiscreteScheduler',
                                "referenceAttn": false,
                                "prompt": prompt + ' single object on black background no people'
                            }
                        })
                })
                .then(response => response.json())
                .then((data: any) => {
                    res({inferenceId: data.inference.id})
                })
                .catch(error => console.error('Error:', error));
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
                    let status = '';
                    let inferenceData: any = null;
                    while (!['succeeded', 'failed'].includes(status)) {
                        // Fetch the inference details
                        try {
                            const inferenceResponse = await fetch(`https://api.cloud.scenario.com/v1/models/Fm1gtd_gRwmopwj2gyWtUA/inferences/${inferenceId}`, {
                                method: 'GET',
                                headers
                            });
                            if (inferenceResponse.ok) {
                                console.log(inferenceResponse.statusText)
                                inferenceData = await inferenceResponse.json();
                                
                            }
                        }catch(err){
                            console.log(err)
                        }
                        status = inferenceData.inference.status;
                        console.log(`Inference status: ${status}`);

                        // Wait for a certain interval before polling again
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Polling every 5 seconds
                    }
                    // Handle the final status
                    if (status === 'succeeded') {
                        console.log('Inference succeeded!');
                        console.log(inferenceData); // Print inference data
                        res(inferenceData)
                    } else {
                        console.log('Inference failed!');
                        console.log(inferenceData); // Print inference data
                        throw new Error("Scenario API Failed")
                    }
                };

                // Start polling the inference status
                await pollInferenceStatus(res);
            })
          }
    }
}

const callContract = async (env: Env, collectibleAddress: string, address: string, tokenID: number): Promise<ethers.providers.TransactionResponse> => {
    const chainConfig: NetworkConfig = findSupportedNetwork(env.CHAIN_HANDLE)!
    
    const provider = new ethers.providers.StaticJsonRpcProvider({
        url: chainConfig.rpcUrl, 
        skipFetchSetup: true // Required for ethers.js Cloudflare Worker support
    })

    const walletEOA = new ethers.Wallet(env.PKEY, provider);
    const relayerUrl = `https://${chainConfig.name}-relayer.sequence.app`

    // Open a Sequence session, this will find or create
    // a Sequence wallet controlled by your server EOA
    const settings: Partial<SessionSettings> = {
        networks: [{
            ...networks[chainConfig.chainId],
            rpcUrl: chainConfig.rpcUrl,
            provider: provider, // NOTE: must pass the provider here
            relayer: {
                url: relayerUrl,
                provider: {
                    url: chainConfig.rpcUrl
                }
            }
        }],
    }

    // Create a single signer sequence wallet session
    const session = await Session.singleSigner({
        settings: settings,
        signer: walletEOA,
        projectAccessKey: env.PROJECT_ACCESS_KEY_PROD
    })

    const signer = session.account.getSigner(chainConfig.chainId)
    
    // Standard interface for ERC1155 contract deployed via Sequence Builder
    const collectibleInterface = new ethers.utils.Interface([
        'function mint(address to, uint256 tokenId, uint256 amount, bytes data)'
    ])
        
    const data = collectibleInterface.encodeFunctionData(
        'mint', [`${address}`, `${tokenID}`, "1", "0x00"]
    )

    const txn = {
        to: collectibleAddress, 
        data: data
    }

    try {
        return await signer.sendTransaction(txn)
    } catch (err) {
        console.error(`ERROR: ${err}`)
        throw err
    }
}

async function handleRequest(request: any, env: Env, ctx: ExecutionContext) {
    const referer = request.headers.get('Referer');

    if (referer.toString() !== env.CLIENT_URL) {
        return new Response('Bad Origin', { status: 401 });
    }

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

    if (env.DEV) {
        env.PROJECT_ACCESS_KEY = env.PROJECT_ACCESS_KEY_DEV
    } else {
        env.PROJECT_ACCESS_KEY = env.PROJECT_ACCESS_KEY_PROD
    }

    try {
        const payload = await request.json()
        const { address, tokenID, mint }: any = payload

        console.log(address)
        console.log(tokenID)
        console.log(mint)

        if (mint) {
            try {
                const txn = await callContract(env, env.CONTRACT_ADDRESS, address, tokenID)
                return new Response(JSON.stringify({txnHash: txn.hash}), { status: 200 })
            } catch(error: any) {
                console.log(error)
                return new Response(JSON.stringify(error), { status: 400 })
            }
        }

        let lootbox = Inference(
            Upload(
                {
                    env: env
                }
            )
        )

        const loot = await generateLoot()
        const id = await lootbox.getInferenceWithItem(loot.loot.name)
        const inferenceObject = await lootbox.getInferenceStatus(id)
        const response = await lootbox.upload(loot.loot.name + " " + loot.loot.type, loot.attributes, inferenceObject.inference.images[0].url)
        
        return new Response(JSON.stringify({
            loot: loot, 
            image: response.url, 
            name: loot.loot.name, 
            tokenID: response.tokenID
        }), { status: 200 });
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify(error), { status: 500 });
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
