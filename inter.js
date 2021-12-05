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
var lines = fs.readFileSync('scenarios/7.txt').toString().split("\n");
var eachLine = []
for (var l in lines) {
    eachLine.push(lines[l].split(" "))
}

const RECEIVE = 10000; // to set
const PAUSE = 10000; // to set

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

    const pattern = async(fn, when) => {
        setTimeout(async () => {
            const i = new Date();
            await fn();
            const end = new Date();
            console.log("SCHEDULED FOR ", when, " BUT FROM ", i - begin, " TO ", end - begin, " (", end - i, ")");
        }, when);
    }

    await users[0].restart();
    setInterval(async() => {
        const end = new Date();
        console.log("RUN AT: ", end - begin);
        await users[0].restart();
    }, RECEIVE + PAUSE);

    var round = 0;
    setTimeout(async () => {
        round += 1;
        const start = new Date();
        await users[0].pause();
        const end = new Date();
        console.log("round : ", round, " ", end - start);
        setInterval(async() => {
            round += 1;
            const start = new Date();
            await users[0].pause();
            const end = new Date();
            console.log("round : ", round, " ", end - start);
        }, PAUSE + RECEIVE);
    }, RECEIVE);

    const no_of_txs = parseInt(eachLine[0]);
    for (var it = 1; it <= no_of_txs; it++) {
        const type = eachLine[it][1];
        const owner = parseInt(eachLine[it][2]);
        const when = parseInt(eachLine[it][0]) + latencies[owner];
        
        
        if (type == 'DEPOSIT') {
            const to = parseInt(eachLine[it][3]);
            const stock = eachLine[it][4];
            const amount = parseInt(eachLine[it][5]);

            if (stock == 'TOKENS') {
                pattern(async() => {await users[owner].addTokens(accounts[to], amount);}, when);
                
            } else {
                pattern(async() => {await users[owner].addStocks(accounts[to], stock, amount);}, when);
            }
        }
        else {
            const stock = eachLine[it][3];
            const amount = parseInt(eachLine[it][4]);
            const price = parseInt(eachLine[it][5]);;
            
            if (type == 'SELL') {
                pattern(async() => {await users[owner].sell(stock, amount, price);}, when);
            }
            else if (type == 'BUY') {
                pattern(async() => {await users[owner].buy(stock, amount, price);}, when);
            } else {
                console.error("invalid tx type");
            }
        }
    }
}

init()
