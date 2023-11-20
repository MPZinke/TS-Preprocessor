

import * as fs from "fs";
import * as path from "path";


import { Token } from "./Token";
import { TokenDefinition } from "./TokenDefinition";


interface RecursiveNumberArray extends Array<RecursiveNumberArray|number>
{}


export class Lexer
{
	filename: string;
	code: string;
	tokens: Token[];
	index: number;
	line: number;
	column: number;

	constructor(filename: string, code: string)
	{
		this.filename = filename;
		this.code = code;

		this.tokens = [];

		this.index = 0;
		this.line = 1;
		this.column = 0;

		this.generate_tokens();
	}


	private generate_tokens(): void
	{
		const token_definiton_string: string = fs.readFileSync(path.resolve(__dirname, "../Source/TokenDefinitions.json"), "utf8");
		const definitions: TokenDefinition[] = JSON.parse(token_definiton_string)
		.map(
			(defintion: any) => new TokenDefinition(defintion.id, defintion.name, new RegExp(defintion.regex))
		);

		let braces_count: number = 0;
		while(this.index < this.code.length)
		{
			let longest_token: TokenDefinition|null = null;
			let longest_token_length: number = 0;
			const substring = this.code.substring(this.index, this.code.length);

			for(var definition_index = 0; definition_index < definitions.length; definition_index++)
			{
				const token_type: TokenDefinition = definitions[definition_index];
				const token_length: number = token_type.length(substring);
				if()
				if(longest_token_length < token_length)
				{
					longest_token = token_type;
					longest_token_length = token_length;
				}
			}

			if(longest_token === null)
			{
				throw new Error(`No matching token found in ${this.filename} at Line ${this.line}, Column ${this.column}
				"${this.code.substr(this.index, 25)}"`);
			}

			this.set_token();
		}
	}


	private set_token(longest_token: TokenDefinition, longest_token_length: number): Token
	{
		const type: string = longest_token!.name;
		const string: string = this.code.substring(this.index, this.index + longest_token_length);
		const index: number = this.index;
		const length: number = longest_token_length;
		const line: number = this.line;
		const column: number = this.column;

		this.tokens.push(new Token(type, string, index, length, line, column));

		console.log(this.tokens[this.tokens.length-1]);

		const token_lines: string[] = string.split("\n");
		if(token_lines.length > 1)
		{
			this.column = 0;
		}
		this.column += token_lines[token_lines.length - 1].length;  // Add the token's last line's length to the column
		this.line += token_lines.length - 1;
		this.index += longest_token_length;
	}
}
