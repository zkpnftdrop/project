import * as shelljs from "shelljs";
import * as fs from "fs";
import * as path from "path";

// @ts-ignore
import { hash2, IncrementalQuinTree, stringifyBigInts, unstringifyBigInts } from "zkpnftdrop-circuits";

const proofGen = async (
  depth: Number,
  randNums: bigint[],
  rapidsnarkBinPath: string,
  circuitsPath: string
): Promise<{ proof: bigint[], publicInputs: bigint[] } | undefined> => {
  const inputJsonPath = "input.json";
  const wtnsPath = "witness.wtns";
  const proofPath = "proof.json";
  const publicInputsPath = "public.json";

  const ZERO_VALUE = BigInt(
    "8370432830353022751713833565135785980866757267633941821328460903436894336785"
  );

  const tree = new IncrementalQuinTree(depth, ZERO_VALUE, 2, hash2);
  for (let i = 0; i < randNums.length; i++) {
    tree.insert(BigInt(randNums[i]));
  }
  const circuitInputs = stringifyBigInts({
    root: tree.root,
    randNums,
  });

  const witnessGenBinPath = path.join("zkeys", "NftDrop_3_prod");

  const zkeyPath = path.join("zkeys", "NftDrop_3_prod.0.zkey");

  fs.writeFileSync(inputJsonPath, JSON.stringify(circuitInputs));

  const witnessGenCmd = `${witnessGenBinPath} ${inputJsonPath} ${wtnsPath}`;

  shelljs.cd(circuitsPath);
  let output = shelljs.exec(witnessGenCmd);

  if (output.stderr) {
    console.error(output.stderr);
    return;
  }

  const proofGenCmd = `${rapidsnarkBinPath} ${zkeyPath} ${wtnsPath} ${proofPath} ${publicInputsPath}`;
  output = shelljs.exec(proofGenCmd);

  if (output.stderr) {
    console.error(output.stderr);
    return;
  }

  const proof = unstringifyBigInts(
    JSON.parse(
      fs.readFileSync(proofPath).toString()
    )
  );

  const publicInputs = unstringifyBigInts(
    JSON.parse(
      fs.readFileSync(publicInputsPath).toString()
    )
  );

  const thisDir = path.join(__dirname, "..");
  shelljs.mv(proofPath, thisDir);
  shelljs.mv(publicInputsPath, thisDir);

  return { proof, publicInputs }
};

if (require.main === module) {
  const DEPTH = 3;
  const randNums: bigint[] = [];
  for (let i = 0; i < 2 ** DEPTH; i++) {
    randNums.push(BigInt(i));
  }

  proofGen(DEPTH, randNums, process.argv[2], process.argv[3]);
}

export { proofGen };
