const Web3 = require("./web3.js-1.2.6");
const MyContract = require("./build/contracts/Timing.json");

const noOfUsers = 7;

const ports = ["http://localhost:22000", "http://localhost:22001",
            "http://localhost:22002", "http://localhost:22003", 
            "http://localhost:22004", "http://localhost:22005",
            "http://localhost:22006"];

// run txs
const init = async() => {
    var accounts = [];

    const web3 = new Web3(ports[0]);
    const id = await web3.eth.net.getId();
    const deployedNetwork = MyContract.networks[id];
    const contract = new web3.eth.Contract(
        MyContract.abi,
        deployedNetwork.address
    );

    const thisAccounts = await web3.eth.getAccounts();
    const account = thisAccounts[0];

    // const ns = [5, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 75000, 100000];
    // const ns = [10, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];
    const ns = [75000];
    const GasLimit = 3000000000;
    const params = {from: account, gas: GasLimit}

    for (var i = 0; i < ns.length; i++) {
        const n = ns[i];
        const start = new Date();
        await contract.methods.change(n, n).send(params);
        const end = new Date();
        console.log(n, " ", end-start);
    }
}

init()
