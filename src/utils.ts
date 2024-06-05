
export function toSnakeCase(str: string) {
	return str.toLowerCase().replace(/\s+/g, '_');
}
export function removeCharacter(str: string, charToRemove: any) {
	return str.replace(new RegExp(charToRemove, 'g'), '');
}
export function formatStatString(str: string, main = true) {
	if (str == null) return []
	const regex = /^(.*?)\s*([+-]?\d+)(-)?(\d+)?(%?)$/;
	const matches = str.match(regex);
	let formattedResult = [];

	if (matches) {
		let [_, stat_name, firstValue, rangeIndicator, secondValue, percentageSymbol] = matches;
		stat_name = removeCharacter(stat_name, ':')
		const baseDisplayType = toSnakeCase(stat_name);
		const isPercentage = percentageSymbol === '%';

		if (rangeIndicator === '-') {
			formattedResult.push({
				"display_type": main ? baseDisplayType + "_min" : "sub_stats_" + baseDisplayType + "_min",
				"trait_type": stat_name + " Minimum",
				"value": parseInt(firstValue, 10) + (isPercentage ? '%' : '')
			});

			formattedResult.push({
				"display_type": main ? baseDisplayType + "_max" : "sub_stats_" + baseDisplayType + "_max",
				"trait_type": stat_name + " Maximum",
				"value": parseInt(secondValue, 10) + (isPercentage ? '%' : '')
			});
		} else {
			formattedResult.push({
				"display_type": main ? baseDisplayType : "sub_stats_" + baseDisplayType,
				"trait_type": stat_name,
				"value": parseInt(firstValue, 10) + (isPercentage ? '%' : '')
			});
		}
	}

	return formattedResult;
}

export async function wait(ms: any) {
	return new Promise((res) => setTimeout(res, ms))
}

export function getCurrentSecond() {
	const now = new Date()
	return now.getSeconds()
}


export function capitalizeFirstWord(str: string) {
	// Check if the string is not empty
	if (str.length === 0) return str;

	// Convert the first character to uppercase and concatenate the rest of the string
	return str.charAt(0).toUpperCase() + str.slice(1);
}


export function isLessThan24Hours (isoDate: string) {
	const dateProvided: any = new Date(isoDate);
	const currentDate: any = new Date();
	const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

	// Calculate the difference in milliseconds
	const difference = currentDate - dateProvided;

	// Check if the difference is less than 24 hours
	return difference < twentyFourHours && difference > 0;
}
