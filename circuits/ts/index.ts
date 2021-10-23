import {
    IncrementalQuinTree,
} from './IncrementalTree'

import { 
    hash1,
    hash2,
    stringifyBigInts,
} from './utils'

const genHashOnion = (
    secrets: bigint[],
) => {
    var hashOnion = hash2([secrets[1], secrets[0]]);

    for(var i = 2; i < secrets.length; i++) {
        hashOnion = hash2([secrets[i], hashOnion])
    }
    return hashOnion
}

export {
    IncrementalQuinTree,
    hash1,
    hash2,
    stringifyBigInts,
    genHashOnion,
}
