# ZKP-enabled fair NFT minting

## Development

Install circom v2:

https://docs.circom.io/

Once you have compiled the circom binary, note down where it is located.

Clone the project and install dependencies:

```bash
git clone git@github.com:zkpnftdrop/project.git && \
cd project && \
npm i && \
npx lerna bootstrap && \
npx lerna build
```

Update `./circuits/circomHelperConfig.json`:

```json
{
    "circom": "<PATH TO CIRCOM BINARY>",
    "snarkjs": "./node_modules/snarkjs/build/cli.cjs",
    "circuitDirs": [
        "./circom/test"
    ]
}
```

During development, you can make Typescript recompile code automatically
whenever you save a file in `ts/`. In each module:

```bash
npm run watch
```

### Circuit development

Make sure nothing else is running on port 9001.

In `circuits/`:

```bash
npm run circom-helper
```
