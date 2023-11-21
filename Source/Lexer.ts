

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
	template_middle: any;
	tokens: Token[];

	// ———— FILE DATA ———— //
	filename: string;
	code: string;

	// ———— CONTEXT ——— //
	index: number;  // Index in the code string
	line: number;  // Current line in the code string
	column: number;  // Current column in the line in the code string
	// ↓ Current recursion in the template. 0 means starting a template. > 0 is current braces in current template.
	template_stack: number[];

	constructor(filename: string, code: string)
	{
		this.definitions = [];
		this.template_middle = [];

		this.tokens = [];

		this.filename = filename;
		this.code = code;

		// Current context
		this.index = 0;
		this.line = 1;
		this.column = 0;
		this.template_stack = [];

		this.generate_tokens();
	}


	private generate_tokens(): void
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
				else
				{
					this.template_middle.push(definition);
				}
			}
		);

		while(this.index < this.code.length)
		{
			let [next_token_definition, next_token_length]: [TokenDefinition, number] = this.next_token();

// if token is a template start
// 	add a zero to the stack
// else if token is an open brace and there is a number on the stack
// 	increment the stack
// else if token is an close brace and there is a number on the stack
// 	if the number is not zero
// 		decrement the number
// 	if the number is zero
// 		pop the zero 
// 		tokenize as a template middle
// else
// 	treat token like it is neither a 
			if(next_token_definition.name === "TemplateHead" && this.code[this.index+next_token_length-1] !== '`')
			{
				this.template_stack.push(0);
			}
			else if(this.template_stack.length !== 0 && next_token_definition.name === "OpenBraceToken")
			{
				this.template_stack[this.template_stack.length-1] += 1;
			}
			else if(this.template_stack.length !== 0 && next_token_definition.name === "CloseBraceToken")
			{
				console.log(`Close Brace Token: Stack ${this.template_stack}`);
				if(this.template_stack[this.template_stack.length-1] !== 0)
				{
					this.template_stack[this.template_stack.length-1] -= 1;
				}
				else
				{
					this.template_stack.pop();
					next_token_definition = this.template_middle[0];
					next_token_length = this.template_middle[0].length(this.code.substring(this.index));
					if(this.code[this.index+next_token_length-1] !== '`')
					{
						this.template_stack.push(0);
					}
				}
			}
			else
			{

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
			// Ignore template middle definition when nothing is on the stack or a close brace is expected.
			if(token_type.name === "TemplateMiddle" && [...this.template_stack].pop() !== 0)
			{
				continue;
			}

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

		console.log(this.tokens[this.tokens.length-1]);

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
