pragma circom 2.0.0;
// TODO: import checkroot circuit
include "checkRoot.circom";
include "hasherPoseidon.circom";

template NftDrop(levels) {
    var numLeaves = 2 ** levels;
    signal input root;
    signal input randNums[numLeaves];
    signal output result;

    //TODO: Instead of the following, just use CheckRoot!
    /*signal input pathElements[numLeaves][1];*/
    /*signal input pathIndices[numLeaves];*/

    // The hash onion is the resulting random value

    // ------------------------------------------------------------------------
    // 1. Prove that, for each randNum, it exists in the Merkle tree with the
    // specified root.

    // For each leaf, pass it into checkroot
    // Constraint: root === checkroot.root;
    component checkRoot = CheckRoot(levels);
    for (var i = 0; i < numLeaves; i ++) {
        checkRoot.leaves[i] <== randNums[i];
    }

    root === checkRoot.root;
    // ------------------------------------------------------------------------
    // 2. Compute the hash onion of randNums and the team's secret and assign
    // it to the output.
    // result <== <HASH ONION>;
    

    var numHashes = numLeaves - 1;
    component hashArray[numHashes];

    hashArray[0] = HashLeftRight();
    hashArray[0].right <== randNums[0];
    hashArray[0].left <== randNums[1];
    

    for (var i = 1; i < numHashes; i ++) {
        hashArray[i] = HashLeftRight();
        hashArray[i].right <== hashArray[i - 1].hash;
        hashArray[i].left <== randNums[i + 1];
    }

    result <== hashArray[numHashes - 1].hash;

}
