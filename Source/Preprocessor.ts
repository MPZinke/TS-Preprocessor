

import * as fs from "fs";
import * as path from "path";


import { Lexer } from "./Lexer";
import { Token } from "./Token";
import { TokenDefinition } from "./TokenDefinition";


interface Dirent
{
	name: string;
	path: string;
	isDirectory: () => boolean;
}


// FROM: https://stackoverflow.com/a/51658344
interface RecursiveStringArray extends Array<RecursiveStringArray|string>{}


async function preprocess_directory(directory: string): Promise<Promise<void>[]>
/*
FROM: https://stackoverflow.com/a/45130990
*/
{
	const children_promises: Promise<void>[] = [];

	const children: Dirent[] = await fs.promises.readdir(directory, { withFileTypes: true });
	for(const child of children)
	{
		const child_path = path.resolve(directory, child.name);
		if(child.isDirectory())
		{
			children_promises.push(...(await preprocess_directory(child_path)).flat());
		}
		else if(child.name.match(/.*\.ts/) !== null)
		{
			children_promises.push(preprocess_file(child_path));
		}
	}

	return children_promises;
}


async function preprocess_file(filepath: string): Promise<void>
{
	const file_contents = await fs.promises.readFile(filepath, "utf8");
	const lexer = new Lexer(filepath, file_contents);
	console.log(`${lexer.filename}: ${lexer.tokens.length}`);
}


async function main()
/*
// Run macros on files
// Write files
*/
{
	// Determine files
	const tsconfig: string = fs.readFileSync("tsconfig.json", "utf8");
	const config = JSON.parse(tsconfig);
	const root_directory = path.resolve(config.compilerOptions!.rootDir || "./");

	await Promise.all(await preprocess_directory(root_directory));
}


main()
.then(
	() => {}
)
.catch(
	(error) =>
	{
		console.log(error);
	}
);
