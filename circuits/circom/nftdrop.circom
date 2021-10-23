pragma circom 2.0.0;
// TODO: import checkroot circuit
include "checkRoot.circom";
include "hasherPoseidon.circom";

template NftDrop(levels) {
    var numLeaves = 2 ** levels;
    signal input root;
    signal input randNums[numLeaves];

    // The hash onion is the resulting random value
    signal output result;

    // ------------------------------------------------------------------------
    // 1. Prove that, for each randNum, it exists in the Merkle tree with the
    // specified root.

    // For each leaf, pass it into checkroot
    // Constraint: root === checkroot.root;

    component merkleHashes[numLeaves];
    
    component checkRoot = CheckRoot(levels);
    for (var i = 0; i < numLeaves; i ++) {
        merkleHashes[i] = Hasher1();
        merkleHashes[i].in <== randNums[i];
        checkRoot.leaves[i] <== merkleHashes[i].hash;
    }

    root === checkRoot.root;

    // ------------------------------------------------------------------------
    // 2. Compute the hash onion of randNums and the team's secret and assign
    // it to the output.
    // result <== <HASH ONION>;

    var numHashes = numLeaves - 1;
    component hashOnionArray[numHashes];

    hashOnionArray[0] = HashLeftRight();
    hashOnionArray[0].right <== randNums[0];
    hashOnionArray[0].left <== randNums[1];
    
    for (var i = 1; i < numHashes; i ++) {
        hashOnionArray[i] = HashLeftRight();
        hashOnionArray[i].right <== hashOnionArray[i - 1].hash;
        hashOnionArray[i].left <== randNums[i + 1];
    }

    result <== hashOnionArray[numHashes - 1].hash;

}
