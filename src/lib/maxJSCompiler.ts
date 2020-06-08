import { basename, dirname, extname } from "path";

import { rollup, RollupBuild, RollupOutput, OutputChunk, OutputAsset } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import babelPlugin from "@rollup/plugin-babel";
import commonJSPlugin from "@rollup/plugin-commonjs";
import builtinsPlugin from "rollup-plugin-node-builtins";
import globalsPlugin from "rollup-plugin-node-globals";
import jsonPlugin from "@rollup/plugin-commonjs";

import { isFile } from "./utils";


export class MaxJSCompiler {

	static banner: string = `
/**
 * This file has been auto-generated in order to prepare external projects using NPM dependencies etc
 * for usage in the [js] and [jsui] object in Max MSP. Any manual changes might be overwritten when regenerating this
 * file. In case you'd like to learn more, report issues etc - pleaser refer to the Project on GitHub:
 *
 * https://github.com/fde31/max-js-bundler
 *
 */
var MAX_MSP = {
  Buffer: Buffer,
  File: File,
  Folder: Folder,
  Global: Global,
  Image: Image,
  LiveAPI: LiveAPI,
  Maxobj: Maxobj,
  Patcher: Patcher,
  PolyBuffer: PolyBuffer,
  Sketch: Sketch,
  SQLite: SQLite,
  SQLResult: SQLResult,
  Task: Task,
  Wind: Wind
};
`;

	readonly filepath: string;
	private bundler: RollupBuild | null = null;

	constructor({
		filepath
	}: {
		filepath: string;
	}) {

		this.filepath = filepath;
	}

	get directoy(): string {
		return dirname(this.filepath);
	}

	get filename(): string {
		return basename(this.filepath);
	}

	get extension(): string {
		return extname(this.filename);
	}

	async setup(): Promise<void> {
		// only setup once
		if (this.bundler) return;
		if (!(await isFile(this.filepath))) throw new Error(`File ${this.filepath} does not exist or is not a file.`);

		this.bundler = await rollup({
			input: this.filepath,
			plugins: [
				nodeResolve({
					browser: true
				}),
				commonJSPlugin({
					sourceMap: false
				}),
				jsonPlugin({}),
				builtinsPlugin(),
				globalsPlugin(),
				babelPlugin({
					babelrc: false,
					babelHelpers: "runtime",
					exclude: "node_modules/**",
					plugins: [
						[
							"@babel/plugin-transform-runtime",
							{
								"absoluteRuntime": true,
								"corejs": 3,
								"helpers": true,
								"regenerator": true,
								"useESModules": true
							}
						]
					],
					presets: [
						[
							"@babel/preset-env",
							{
								"useBuiltIns": "usage",
								"corejs": 3
							}
						]
					]
				})
			],
			treeshake: false
		});
	}

	async output(): Promise<string> {

		if (!this.bundler) throw new Error("Compiler has not been setup yet.");

		const result: RollupOutput = await this.bundler.generate({
			banner: MaxJSCompiler.banner,
			compact: false,
			format: "c74max",
			strict: false
		});

		if (!result.output || result.output.length === 0) throw new Error("No output chunk generated");

		const outputChunk: OutputChunk | OutputAsset | undefined = result.output.shift();
		if (!outputChunk || outputChunk.type === "asset") return "";

		return outputChunk.code || "";
	}
}
