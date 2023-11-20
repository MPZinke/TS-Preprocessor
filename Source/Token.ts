

export class Token
{
	type: string;
	string: string;
	index: number;
	length: number;
	line: number;
	column: number;

	constructor(type: string, string: string, index: number, length: number, line: number, column: number)
	{
		this.type = type;
		this.string = string;
		this.index = index;
		this.length = length;
		this.line = line;
		this.column = column;
	}
}
