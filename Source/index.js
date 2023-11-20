exports.printMsg = function() {
  console.log("This is a message from the demo package");
}


exports.run = function main()
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
	const root_directory = config.compilerOptions!.rootDir || "./";

	const files = get_files(root_directory)
	.then(
		(files) =>
		{
			for(const file of files)
			{
				console.log(file);
			}
		}
	);
}


main();