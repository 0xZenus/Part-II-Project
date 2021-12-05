const Web3 = require("./web3.js-1.2.6");
const MyContract = require("./build/contracts/System.json");
const API = require("./contract-interaction.js");

const noOfUsers = 7;

const ports = ["http://localhost:22000", "http://localhost:22001",
            "http://localhost:22002", "http://localhost:22003", 
            "http://localhost:22004", "http://localhost:22005",
            "http://localhost:22006"];

const names = ["bank", "alice", "bob", "charlie", "david", "emily", "felix"];
const latencies = [0, 0, 0, 0, 0, 0, 0];

// run txs
const init = async() => {
    var users = [];
    var accounts = [];

    for (var it = 0; it < noOfUsers; it++) {
        const web3 = new Web3(ports[it]);
        const id = await web3.eth.net.getId();
        const deployedNetwork = MyContract.networks[id];
        const contract = new web3.eth.Contract(
            MyContract.abi,
            deployedNetwork.address
        );
        const thisAccounts = await web3.eth.getAccounts();
        const account = thisAccounts[0];
        const user = new API(contract, account);
        
        await user.setUsername(names[it]);

        users.push(user);
        accounts.push(account);
    }

    const rounds = 100;
    const maxRounds = 10000;

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e9; i++) {
          if ((new Date().getTime() - start) > milliseconds){
            break;
          }
        }
      }

    await users[0].addTokens(accounts[1], maxRounds);
    await users[0].addTokens(accounts[2], maxRounds);

    await users[0].addStocks(accounts[3], "AAPL", 2*maxRounds);

    var stocks1, stocks2;
    for (var r = 0; r < rounds; r++) {

        console.log(" ");
        console.log("round: ", r);
        await users[0].restart();

        await users[3].sell("AAPL", 1, 1);
        await users[0].pause();

        await users[0].restart();
        sleep(500);
        await users[1].buy("AAPL", 1, 1);
        sleep(1000);
        await users[2].buy("AAPL", 1, 1);
        await users[0].pause();

        stocks1 = await users[1].getWalletsStocks();
        stocks2 = await users[2].getWalletsStocks();
        console.log(stocks1, stocks2);

        await users[0].restart();
        await users[3].sell("AAPL", 1, 1);
        await users[0].pause();
        stocks1 = await users[1].getWalletsStocks();
        stocks2 = await users[2].getWalletsStocks();
        console.log(stocks1, stocks2);
    }
}

init()
