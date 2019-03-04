import { expect, test } from "@oclif/test";
import { dirname, join } from "path";
import { existsSync, promises } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

import { ExitCodes } from "../../src/lib/utils";

const execAsync = promisify(exec);
const { mkdir, unlink, rmdir } = promises;

const NPM_CMD = process.platform === "win32" ? "npm.cmd" : "npm";

const ExampleBasePath = join(__dirname, "..", "..", "examples");

interface ExamplePathInfo {
	description: string;
	source: string;
	output: string;
}

enum Example {

	es6Basic,
	es6Clasess,

	es17Values,

	localImport,
	localRequire,

	npmImport,
	tonalImport
}

const EXAMPLES_OUT = join(__dirname, "tmp");

const exampleFiles: { [s: string]: ExamplePathInfo} = {
	[Example.es6Basic]: {
		description: "Basic ES 6 support",
		source: join(ExampleBasePath, "es6", "basic.js"),
		output: join(EXAMPLES_OUT, "es6.basic.build.js")
	},
	[Example.es6Clasess]: {
		description: "ES6 Classes Support",
		source: join(ExampleBasePath, "es6", "classes.js"),
		output: join(EXAMPLES_OUT, "es6.classes.build.js")
	},
	[Example.es17Values]: {
		description: "ES17 Object.values Support",
		source: join(ExampleBasePath, "es17", "values.js"),
		output: join(EXAMPLES_OUT, "es17.values.build.js")
	},
	[Example.localImport]: {
		description: "Local Dependency using import/from",
		source: join(ExampleBasePath, "dep-local", "import.js"),
		output: join(EXAMPLES_OUT, "dep.import.build.js")
	},
	[Example.localRequire]: {
		description: "Local Dependency using require()",
		source: join(ExampleBasePath, "dep-local", "require.js"),
		output: join(EXAMPLES_OUT, "dep.require.build.js")
	},

	[Example.npmImport]: {
		description: "NPM Dependency inclusion",
		source: join(ExampleBasePath, "dep-npm", "index.js"),
		output: join(EXAMPLES_OUT, "npm.import.build.js")
	},
	[Example.tonalImport]: {
		description: "Tonal Dependency inclusion",
		source: join(ExampleBasePath, "dep-tonal", "index.js"),
		output: join(EXAMPLES_OUT, "tonal.import.build.js")
	}
};

const clearExamples = async (): Promise<void> => {
	const keys: string[] = Object.keys(exampleFiles);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const pathInfo: ExamplePathInfo = exampleFiles[key];
		if (existsSync(pathInfo.output)) await unlink(pathInfo.output);
	}
	if (existsSync(EXAMPLES_OUT)) await rmdir(EXAMPLES_OUT);
};

const prepareExamples = async (): Promise<void> => {
	if (!existsSync(EXAMPLES_OUT)) await mkdir(EXAMPLES_OUT);

	const keys: string[] = Object.keys(exampleFiles);
	for (let i = 0; i < keys.length; i++) {
		const key: number = parseInt(keys[i], 10);
		const pathInfo: ExamplePathInfo = exampleFiles[key];

		const exampleDir: string = dirname(pathInfo.source);

		// install dependencies
		if (existsSync(join(exampleDir, "package.json"))) await execAsync(`${NPM_CMD} ci`, { cwd: exampleDir });
	}
};

before(async () => {
	// delete build files
	await clearExamples();

	// install example dependencies
	await prepareExamples();
});

after(async () => {
	await clearExamples();
});

describe("build", () => {

	// Basics
	test
		.stdout()
		.command(["build", `${exampleFiles[Example.es6Basic].source}`])
		.it("runs successfully on a single file and prints the results to stdout", ({ stdout }) => {
			expect(stdout).to.contain("var msg_int = ");
		});

	test
		.command(["build", `${exampleFiles[Example.es6Basic].source}`, "--output", `${exampleFiles[Example.es6Basic].output}`])
		.it("runs successfully on a single file and creates the output file", () => {
			expect(existsSync(exampleFiles[Example.es6Basic].output)).to.be.true;
		});

	test
		.command(["build", `${exampleFiles[Example.es6Basic].source}`, "--output", `${exampleFiles[Example.es6Basic].output}`])
		.exit(ExitCodes.no_overwrite)
		.it("successfully catches a potential file overwrite");

	test
		.command(["build", `${exampleFiles[Example.es6Basic].source}`, "--output", `${__dirname}`])
		.exit(ExitCodes.no_file_overwrite)
		.it("successfully catches non-file output");

	test
		.command(["build", `${exampleFiles[Example.es6Basic].source}`, "--output", `${exampleFiles[Example.es6Basic].output}`, "--force"])
		.it("runs successfully on a single file overwrites the output file", () => {
			expect(existsSync(exampleFiles[Example.es6Basic].output)).to.be.true;
		});

	const keys: string[] = Object.keys(exampleFiles);
	for (let i = 0, il = keys.length; i < il; i++) {

		const key = keys[i];

		test
			.command(["build", `${exampleFiles[key].source}`, "--output", `${exampleFiles[key].output}`, "--force"])
			.it(`runs successfully on: "${exampleFiles[key].description}"`, () => {
				expect(existsSync(exampleFiles[key].output)).to.be.true;
			});
	}

});
