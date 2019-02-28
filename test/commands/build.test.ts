import { expect, test } from "@oclif/test";
import { join } from "path";
import { existsSync, promises } from "fs";

import { ExitCodes } from "../../src/lib/utils";

const { unlink } = promises;

const ExampleBasePath = join(__dirname, "..", "..", "examples");

interface ExamplePathInfo {
	source: string;
	output: string;
}

enum Example {
	basic,
	localImport,
	npmImport,
	tonalImport
}

const exampleFiles: { [s: number]: ExamplePathInfo} = {
	[Example.basic]: {
		source: join(ExampleBasePath, "basic-es6", "index.js"),
		output: join(__dirname, "basic.build.js")
	},
	[Example.localImport]: {
		source: join(ExampleBasePath, "local-import", "index.js"),
		output: join(__dirname, "local-import.build.js")
	},
	[Example.npmImport]: {
		source: join(ExampleBasePath, "npm-import", "index.js"),
		output: join(__dirname, "npm-import.build.js")
	},
	[Example.tonalImport]: {
		source: join(ExampleBasePath, "tonal-import", "index.js"),
		output: join(__dirname, "tonal-import.build.js")
	}

};

const clearExample = async (): Promise<void> => {
	const keys: string[] = Object.keys(exampleFiles);
	for (let i = 0; i < keys.length; i++) {
		const key: number = parseInt(keys[i], 10);
		const pathInfo: ExamplePathInfo = exampleFiles[key];
		if (existsSync(pathInfo.output)) await unlink(pathInfo.output);
	}
};

before(async () => await clearExample());
after(async () => await clearExample());

describe("build", () => {

	// Basics
	test
		.stdout()
		.command(["build", `${exampleFiles[Example.basic].source}`])
		.it("runs successfully on a single file and prints the results to stdout", ({ stdout }) => {
			expect(stdout).to.contain("var msg_int = ");
		});

	test
		.command(["build", `${exampleFiles[Example.basic].source}`, "--output", `${exampleFiles[Example.basic].output}`])
		.it("runs successfully on a single file and creates the output file", () => {
			expect(existsSync(exampleFiles[Example.basic].output)).to.be.true;
		});

	test
		.command(["build", `${exampleFiles[Example.basic].source}`, "--output", `${exampleFiles[Example.basic].output}`])
		.exit(ExitCodes.no_overwrite)
		.it("successfully catches a potential file overwrite");

	test
		.command(["build", `${exampleFiles[Example.basic].source}`, "--output", `${__dirname}`])
		.exit(ExitCodes.no_file_overwrite)
		.it("successfully catches non-file output");

	test
		.command(["build", `${exampleFiles[Example.basic].source}`, "--output", `${exampleFiles[Example.basic].output}`, "--force"])
		.it("runs successfully on a single file overwrites the output file", () => {
			expect(existsSync(exampleFiles[Example.basic].output)).to.be.true;
		});

	test
		.command(["build", `${exampleFiles[Example.localImport].source}`, "--output", `${exampleFiles[Example.localImport].output}`, "--force"])
		.it("runs successfully on a file with local imports", () => {
			expect(existsSync(exampleFiles[Example.localImport].output)).to.be.true;
		});

	test
		.command(["build", `${exampleFiles[Example.npmImport].source}`, "--output", `${exampleFiles[Example.npmImport].output}`, "--force"])
		.it("runs successfully on a file using npm dependencies", () => {
			expect(existsSync(exampleFiles[Example.npmImport].output)).to.be.true;
		});

	test
		.command(["build", `${exampleFiles[Example.tonalImport].source}`, "--output", `${exampleFiles[Example.tonalImport].output}`, "--force"])
		.it("runs successfully on a file using npm dependencies", () => {
			expect(existsSync(exampleFiles[Example.tonalImport].output)).to.be.true;
		});

});
