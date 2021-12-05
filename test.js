const Web3 = require("./web3.js-1.2.6");
const MyContract = require("./build/contracts/SimpleStorage.json");

var contract;

const init = async() => {
    const web3 = new Web3("http://localhost:22000");
    const id = await web3.eth.net.getId();
    const deployedNetwork = MyContract.networks[id];
    contract = new web3.eth.Contract(
        MyContract.abi,
        deployedNetwork.address
    );

    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    const GasLimit = 3000000000;
    const n = 1000000;

    const start = new Date();
    const params = {from: account, gas: GasLimit}
    await contract.methods.iterate(n).send(params);
    const end = new Date();
    console.log(end - start);
}

init()
