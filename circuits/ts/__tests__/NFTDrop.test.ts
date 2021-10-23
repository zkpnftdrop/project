jest.setTimeout(90000)
import * as fs from 'fs'
import { 
    genWitness,
    getSignalByName,
    hash1,
    genRandomSalt,
    stringifyBigInts,
    hash2,
} from '../utils'

import {
    IncrementalQuinTree,
} from '../IncrementalTree'

const ZERO_VALUE = BigInt(0)
const DEPTH = 3
const LEAVES_PER_NODE = 2
const LEVELS = DEPTH

describe('NDF drop test', () => {
    const circuit = 'nftdrop_test'

    it('first test', async () => {
        const tree = new IncrementalQuinTree(LEVELS, ZERO_VALUE, 2, hash1)
        const secrets: BigInt[] = []
        const leaves: BigInt[] = []

        const numLeaves = 2 ** LEVELS;
        for (let i = 0; i < numLeaves; i++) {
            const secret = genRandomSalt()
            const hashedSecret = hash1([secret])
            tree.insert(hashedSecret)
            secrets.push(secret)
            leaves.push(hashedSecret)
        }

        const root = tree.root

        var hashOnion = hash2([secrets[1], secrets[0]]);
        
    
        for(var i = 2; i < numLeaves; i++) {
            hashOnion = hash2([secrets[i], hashOnion])
        }


        const circuitInputs = stringifyBigInts({
            randNums: secrets,
            root
        })

        fs.writeFileSync('input.json', JSON.stringify(circuitInputs))
        const witness = await genWitness(circuit, circuitInputs)
        const result = await getSignalByName(circuit, witness, 'main.result')
        expect(result).toEqual(hashOnion.toString())
    })

   
})
