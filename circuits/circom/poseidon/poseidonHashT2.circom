pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template PoseidonHashT2() {
    signal input hashInput;
    signal output out;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== hashInput;
    out <== hasher.out;
}
