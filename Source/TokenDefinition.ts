

export class TokenDefinition
{
	id: number;
	name: string;
	regex: RegExp;

	constructor(id: number, name: string, regex: RegExp)
	{
		this.id = id;
		this.name = name;
		this.regex = regex;
	}


	public length(code: string): number
	{
		const match: string[]|null = code.match(this.regex);
		if(match === null || (match as any)["index"] !== 0)
		{
			return 0;
		}

		// console.log(match);
		return match[0].length;
	}
}
