import { patract, network } from 'redspot';
const { getContractFactory } = patract;
const { createSigner, keyring, api } = network;
require('dotenv').config();

const uri = process.env.SEED_PHRASE;

async function run() {

  await api.isReady;

  const signer = createSigner(keyring.createFromUri(uri));
  console.log(signer.address)
  const contractFactory = await getContractFactory('skyekiwi', signer);
  const contract = await contractFactory.deploy('new');
  console.log('');
  console.log(
    'Deploy successfully. The contract address: ',
    contract.address.toString()
  );
  api.disconnect();
}

run().catch((err) => {
  console.log(err);
});
