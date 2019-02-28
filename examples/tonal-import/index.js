import { midi } from "tonal";

const log = (...args) => {
	post(`${args.join(", ")}\n`);
};

const bang = () => {
	post(midi("c4"));
};
