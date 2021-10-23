// @ts-ignore
import { overwriteArtifact } from "hardhat-artifactor";
// @ts-ignore
// eslint-disable-next-line camelcase
import { poseidon_gencontract } from "circomlibjs";

const buildPoseidon = async (numInputs: number) => {
  await overwriteArtifact(
    `PoseidonT${numInputs + 1}`,
    poseidon_gencontract.createCode(numInputs)
  );
};

const buildPoseidonT3 = () => buildPoseidon(2);

if (require.main === module) {
  buildPoseidonT3();
}
