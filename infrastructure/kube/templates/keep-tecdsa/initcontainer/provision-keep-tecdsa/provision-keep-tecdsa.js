const fs = require('fs');
const toml = require('toml');
const tomlify = require('tomlify-j0.4');
const concat = require('concat-stream');
const Web3 = require('web3');

const { depositBondingValue } = require('./bonding')

// ETH host info
const ethHost = process.env.ETH_HOSTNAME;
const ethWsPort = process.env.ETH_WS_PORT;
const ethRpcPort = process.env.ETH_RPC_PORT;
const ethNetworkId = process.env.ETH_NETWORK_ID;

/*
We override transactionConfirmationBlocks and transactionBlockTimeout because they're
25 and 50 blocks respectively at default.  The result of this on small private testnets
is long wait times for scripts to execute.
*/
const web3_options = {
    defaultBlock: 'latest',
    defaultGas: 4712388,
    transactionBlockTimeout: 25,
    transactionConfirmationBlocks: 3,
    transactionPollingTimeout: 480
};
const web3 = new Web3(new Web3.providers.HttpProvider(ethHost + ':' + ethRpcPort), null, web3_options);

/*
Each <contract.json> file is sourced directly from the InitContainer.  Files are generated by
Truffle during contract migration and copied to the InitContainer image via Circle.
*/

const ecdsaKeepFactoryJsonFile = '/tmp/ECDSAKeepFactory.json';
const ecdsaKeepFactoryParsed = JSON.parse(fs.readFileSync(ecdsaKeepFactoryJsonFile));
const ecdsaKeepFactoryContractAddress = ecdsaKeepFactoryParsed.networks[ethNetworkId].address;

const keepBondingContractJsonFile = '/tmp/KeepBonding.json';
const keepBondingContractParsed = JSON.parse(fs.readFileSync(keepBondingContractJsonFile));
const keepBondingContractAbi = keepBondingContractParsed.abi;
const keepBondingContractAddress = keepBondingContractParsed.networks[ethNetworkId].address;
const keepBondingContract = new web3.eth.Contract(keepBondingContractAbi, keepBondingContractAddress);

async function provisionKeepTecdsa() {

  try {

    console.log('###########  Provisioning keep-tecdsa! ###########');
    console.log('\n<<<<<<<<<<<< Setting Up Operator Account ' + '>>>>>>>>>>>>');

    let operatorEthAccountPassword = process.env.KEEP_ETHEREUM_PASSWORD;
    let operatorAccount = await createOperatorEthAccount('operator');
    var operator = operatorAccount['address'];

    await createOperatorEthAccountKeyfile(operatorAccount['privateKey'], operatorEthAccountPassword);

    // We wallet add to make the local account available to web3 functions in the script.
    await web3.eth.accounts.wallet.add(operatorAccount['privateKey']);

    // Eth account that contracts are migrated against.
    let contractOwner = process.env.CONTRACT_OWNER_ETH_ACCOUNT_ADDRESS;
    // Eth account that's both miner and coinbase on internal testnet
    let purse = process.env.CONTRACT_OWNER_ETH_ACCOUNT_ADDRESS;

    console.log('\n<<<<<<<<<<<< Unlocking Contract Owner Account ' + contractOwner + ' >>>>>>>>>>>>');
    await unlockEthAccount(contractOwner, process.env.KEEP_ETHEREUM_PASSWORD);

    console.log('\n<<<<<<<<<<<< Funding Operator Account ' + operator + ' >>>>>>>>>>>>');
    await fundOperatorAccount(operator, purse, '1');

    console.log('\n<<<<<<<<<<<< Depositing Bonding Value for Operator Account ' + operator + ' >>>>>>>>>>>>');
    await depositBondingValue(keepBondingContract, purse, operator, '10');

    console.log('\n<<<<<<<<<<<< Creating keep-tecdsa Config File >>>>>>>>>>>>');
    await createKeepTecdsaConfig(operator);

    console.log("\n########### keep-tecdsa Provisioning Complete! ###########");
  }
  catch(error) {
    console.error(error.message);
    throw error;
  }
};

async function createOperatorEthAccount(accountName) {

  let ethAccount = await web3.eth.accounts.create();

  // We write to a file for later passage to the keep-tecdsa container
  fs.writeFile('/mnt/keep-tecdsa/config/eth_account_address', ethAccount['address'], (error) => {
    if (error) throw error;
  });
  console.log(accountName + ' Account '  + ethAccount['address'] + ' Created!');
  return ethAccount;
};

// We are creating a local account.  We must manually generate a keyfile for use by the keep-tecdsa
async function createOperatorEthAccountKeyfile(ethAccountPrivateKey, ethAccountPassword) {

  let ethAccountKeyfile = await web3.eth.accounts.encrypt(ethAccountPrivateKey, ethAccountPassword);

  // We write to a file for later passage to the keep-tecdsa container
  fs.writeFile('/mnt/keep-tecdsa/config/eth_account_keyfile', JSON.stringify(ethAccountKeyfile), (error) => {
    if (error) throw error;
  });
  console.log('Keyfile generated!');
};

async function unlockEthAccount(ethAccount, ethAccountPassword) {

  await web3.eth.personal.unlockAccount(ethAccount, ethAccountPassword, 150000);

  console.log('Account ' + ethAccount + ' unlocked!');
};

async function fundOperatorAccount(operator, purse, etherToTransfer) {

  let transferAmount = web3.utils.toWei(etherToTransfer, "ether")

  console.log("Funding account " + operator + " with " + transferAmount + " wei from purse " + purse);
  await web3.eth.sendTransaction({from:purse, to:operator, value:transferAmount});
  console.log("Account " + operator + " funded!");
}

async function createKeepTecdsaConfig(operator) {

  fs.createReadStream('/tmp/keep-tecdsa-template.toml', 'utf8').pipe(concat(function(data) {
    let parsedConfigFile = toml.parse(data);

    parsedConfigFile.ethereum.URL = ethHost.replace('http://', 'ws://') + ':' + ethWsPort;
    parsedConfigFile.ethereum.account.KeyFile = process.env.KEEP_TECDSA_ETH_KEYFILE
    parsedConfigFile.ethereum.ContractAddresses.ECDSAKeepFactory = ecdsaKeepFactoryContractAddress;
    parsedConfigFile.Storage.DataDir = process.env.KEEP_DATA_DIR;

    fs.writeFile('/mnt/keep-tecdsa/config/keep-tecdsa-config.toml', tomlify.toToml(parsedConfigFile), (error) => {
      if (error) throw error;
    });
  }));

  console.log("keep-tecdsa config written to /mnt/keep-tecdsa/config/keep-tecdsa-config.toml");
};

provisionKeepTecdsa().catch(error => {
  console.error(error);
  process.exit(1);
});

