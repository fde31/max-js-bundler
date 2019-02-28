import { existsSync, promises, Stats } from "fs";

const { lstat, mkdir } = promises;

export const isFile = async (filepath: string): Promise<boolean> => {
	if (!existsSync(filepath)) return false;
	const fileStats: Stats = await lstat(filepath);
	return fileStats.isFile();
};

export const isDir = async (dirpath: string): Promise<boolean> => {
	if (!existsSync(dirpath)) return false;
	const stats = await lstat(dirpath);
	return stats.isDirectory();
};

export const ensureDir = async (dirpath: string): Promise<void> => {
	if (!(await isDir(dirpath))) await mkdir(dirpath, { recursive: true });
};

export enum ExitCodes {
	success = 0,
	error=1,
	no_overwrite=10,
	no_file_overwrite=11,

}
