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
    genHashOnion,
} from '../'

import {
    IncrementalQuinTree,
} from '../IncrementalTree'

const ZERO_VALUE = BigInt(0)
const LEAVES_PER_NODE = 2
const LEVELS = 3

describe('NFT drop test', () => {
    const circuit = 'nftdrop_test'

    it('first test', async () => {
        const tree = new IncrementalQuinTree(LEVELS, ZERO_VALUE, 2, hash2)
        //const secrets: BigInt[] = []
        const leaves: BigInt[] = []

        const numLeaves = 2 ** LEVELS;
        const secrets = [10000, 1888, 2888, 3888, 0, 0, 0, 0].map((x) => BigInt(x))

        for (let i = 0; i < numLeaves; i++) {
            const secret = secrets[i]
            const hashedSecret = hash1([secret])
            tree.insert(hashedSecret)
            leaves.push(hashedSecret)
        }
        console.log(tree.leaves)
        //for (let i = 0; i < numLeaves; i++) {
            //const secret = BigInt(0)//genRandomSalt()
            //const hashedSecret = hash1([secret])
            //tree.insert(hashedSecret)
            //secrets.push(secret)
            //leaves.push(hashedSecret)
        //}

        const root = tree.root
        console.log(tree.root)

        const hashOnion = genHashOnion(secrets)

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
