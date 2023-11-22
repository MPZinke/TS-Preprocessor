

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


interface RecursiveStringArray extends Array<RecursiveStringArray|string>
/*
FROM: https://stackoverflow.com/a/51658344
*/
{}


async function get_files(directory: string): Promise<string[]>
/*
FROM: https://stackoverflow.com/a/45130990
*/
{
	const children: Dirent[] = await fs.promises.readdir(directory, { withFileTypes: true });
	const files: RecursiveStringArray = await Promise.all(
		children.map(
			(child: Dirent) =>
			{
				const resolution = path.resolve(directory, child.name);
				if(child.isDirectory())
				{
					return get_files(resolution)
				}

				return resolution;
			}
		)
	);

	return (files.flat() as string[]).filter(path => path.match(/.*\.ts/) !== null);
}


async function main()
/*
// Determine files
// Read files
// Parse files
// Run macros on files
// Write files
*/
{
	const tsconfig: string = fs.readFileSync("tsconfig.json", "utf8");
	const config = JSON.parse(tsconfig);
	const root_directory = path.resolve(config.compilerOptions!.rootDir || "./");

	const files = await get_files(root_directory);
	console.log(files);
	// const file_contents = await fs.promises.readFile(files[0], "utf8");
	// const lexer = new Lexer(files[0], file_contents);
	// console.log(lexer.tokens);

	const token_streams = await Promise.all(
		files.map(
			async (filepath: string) =>
			{
				console.log(filepath);
				const file_contents = await fs.promises.readFile(filepath, "utf8");
				const lexer = new Lexer(filepath, file_contents);
				console.log(lexer.tokens);
			}
		)
	);
	// for(const file of files)
	// {
	// 	console.log(file);
	// }
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
