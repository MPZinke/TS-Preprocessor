

import * as fs from "fs";
import * as path from "path";


import { Token } from "./Token";
import { TokenDefinition } from "./TokenDefinition";


interface RecursiveNumberArray extends Array<RecursiveNumberArray|number>
{}


export class Lexer
{
	// ———— GRAMMAR ———— //
	definitions: TokenDefinition[];
	template_middle: TokenDefinition|null;
	tokens: Token[];

	// ———— FILE DATA ———— //
	filename: string;
	code: string;

	// ———— CURRENT CONTEXT ——— //
	index: number;  // Index in the code string
	line: number;  // Current line in the code string
	column: number;  // Current column in the line in the code string

	constructor(filename: string, code: string)
	{
		// ———— GRAMMAR ———— //
		this.definitions = [];
		this.template_middle = null;
		this.tokens = [];

		// ———— FILE DATA ———— //
		this.filename = filename;
		this.code = code;

		// Current context
		// ———— CURRENT CONTEXT ——— //
		this.index = 0;
		this.line = 1;
		this.column = 0;

		this.create_definitions();
		this.parse_tokens();
	}


	private create_definitions(): void
	{
		const definitions_filepath: string = path.resolve(__dirname, "../Source/TokenDefinitions.json");
		const token_definiton_string: string = fs.readFileSync(definitions_filepath, "utf8");
		JSON.parse(token_definiton_string)
		.map(
			(definition: any) => new TokenDefinition(definition.id, definition.name, new RegExp(definition.regex))
		)
		.forEach(
			(definition: TokenDefinition) =>
			{
				if(definition.name !== "TemplateMiddle")
				{
					this.definitions.push(definition);
				}
				// Removed to ignore template middle definition when nothing is on the stack or a close brace is expected.
				else
				{
					this.template_middle = definition;
				}
			}
		);
	}


	private parse_tokens(): void
	{
		// ↓ Current recursion in the template. 0 means starting a template. > 0 is current braces in current template.
		const template_stack: number[] = [];
		while(this.index < this.code.length)
		{
			let [next_token_definition, next_token_length]: [TokenDefinition, number] = this.next_token();

			// If token is a template start, add a zero to the stack.
			if(next_token_definition.name === "TemplateHead" && this.code[this.index+next_token_length-1] !== '`')
			{
				template_stack.push(0);
			}
			// If token is an open brace and there is a number on the stack, increment the stack.
			else if(template_stack.length !== 0 && next_token_definition.name === "OpenBraceToken")
			{
				template_stack[template_stack.length-1] += 1;
			}
			// If token is an close brace and there is a number on the stack.
			else if(template_stack.length !== 0 && next_token_definition.name === "CloseBraceToken")
			{
				// If the number is not zero, decrement the number.
				if(template_stack[template_stack.length-1] !== 0)
				{
					template_stack[template_stack.length-1] -= 1;
				}
				// If the number is zero, pop the zero & tokenize as a template middle.
				else
				{
					template_stack.pop();
					next_token_definition = this.template_middle!;
					next_token_length = this.template_middle!.length(this.code.substring(this.index));
					if(this.code[this.index+next_token_length-1] !== '`')
					{
						template_stack.push(0);
					}
				}
			}

			this.set_token(next_token_definition, next_token_length);
		}
	}


	private next_token(): [TokenDefinition, number]
	{
		let longest_token_definition: TokenDefinition;
		let longest_token_length: number = 0;
		const substring = this.code.substring(this.index);

		for(var definition_index = 0; definition_index < this.definitions.length; definition_index++)
		{
			const token_type: TokenDefinition = this.definitions[definition_index];
			const token_length: number = token_type.length(substring);
			if(longest_token_length < token_length)
			{
				longest_token_definition = token_type;
				longest_token_length = token_length;
			}
		}

		if(longest_token_length === 0)
		{
			throw new Error(`No matching token found in ${this.filename} at Line ${this.line}, Column ${this.column}
			"${this.code.substr(this.index, 25)}..."`);
		}

		return [longest_token_definition!, longest_token_length];
	}


	private set_token(next_token: TokenDefinition, next_token_length: number): void
	{
		const type: string = next_token!.name;
		const string: string = this.code.substring(this.index, this.index + next_token_length);
		const index: number = this.index;
		const length: number = next_token_length;
		const line: number = this.line;
		const column: number = this.column;

		this.tokens.push(new Token(type, string, index, length, line, column));

		const token_lines: string[] = string.split("\n");
		if(token_lines.length > 1)
		{
			this.column = 0;
		}
		this.column += token_lines[token_lines.length - 1].length;  // Add the token's last line's length to the column
		this.line += token_lines.length - 1;
		this.index += next_token_length;
	}
}
