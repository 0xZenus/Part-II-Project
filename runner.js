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

// parse scenario
var fs = require('fs');
var lines = fs.readFileSync('scenarios/20Rounds.txt').toString().split("\n");
var eachLine = []
for (var l in lines) {
    eachLine.push(lines[l].split(" "))
}

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

    const begin = new Date();

    const offset = parseInt(eachLine[0]);
    const rounds = parseInt(eachLine[1]);
    const batch = parseInt(eachLine[2]);

    var it = 3;
    var curr = 0;
    for (var r = 0; r < rounds; r++) {

        console.log("round: ", r);
        await users[0].restart();

        const n = (r == 0) ? batch+offset : batch;
        for (var i = 0; i < n; i++, it++) {
            const type = eachLine[it][1];
            const owner = parseInt(eachLine[it][2]);
            
            if (type == 'DEPOSIT') {
                const to = parseInt(eachLine[it][3]);
                const stock = eachLine[it][4];
                const amount = parseInt(eachLine[it][5]);
    
                if (stock == 'TOKENS') {
                    users[owner].addTokens(accounts[to], amount);
                    
                } else {
                    users[owner].addStocks(accounts[to], stock, amount);
                }
            }
            else {
                const stock = eachLine[it][3];
                const amount = parseInt(eachLine[it][4]);
                const price = parseInt(eachLine[it][5]);;
                
                if (type == 'SELL') {
                    curr++;
                    users[owner].sell(stock, amount, price);
                    console.log(curr);
                }
                else if (type == 'BUY') {
                    curr++;
                    users[owner].buy(stock, amount, price);
                    console.log(curr);
                } else {
                    console.error("invalid tx type");
                }
            }
        }

        await users[0].pause();
    }
}

init()
