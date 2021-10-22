pragma circom 2.0.0;
// TODO: import checkroot circuit

template NftDrop(levels) {
    var numLeaves = 2 ** levels;
    signal input teamSecret;
    signal input root;
    signal input randNums[numLeaves];

    //TODO: Instead of the following, just use CheckRoot!
    /*signal input pathElements[numLeaves][1];*/
    /*signal input pathIndices[numLeaves];*/

    // The hash onion is the resulting random value
    signal output result;

    // ------------------------------------------------------------------------
    // 1. Prove that, for each randNum, it exists in the Merkle tree with the
    // specified root.

    // For each leaf, pass it into checkroot
    // Constraint: root === checkroot.root;

    // ------------------------------------------------------------------------
    // 2. Compute the hash onion of randNums and the team's secret and assign
    // it to the output.
    // result <== <HASH ONION>;
}
