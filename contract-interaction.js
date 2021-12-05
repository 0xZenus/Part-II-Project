// Contract interactions

class API {
    constructor(contract, account) {
        this.contract = contract;
        this.account = account;
        this.GasLimit = 3000000000;
        this.params = {from: this.account, gas: this.GasLimit}

        this.addTokens = async (dest, amount) => {
            await this.contract.methods.add_tokens(dest, amount).send(this.params);
        }

        this.addStocks = async (dest, stock, amount) => {
            await this.contract.methods.add_stocks(dest, stock, amount).send(this.params);
        }

        this.sell = async (stock, amount, price) => {
            // await this.contract.methods.sell(stock, amount, price).send(this.params);
            try {
                await this.contract.methods.sell(stock, amount, price).send(this.params);
            }
            catch (error) {
                console.log("TX FAILED: system currently paused...");
            }
        }

        this.buy = async (stock, amount, price) => {
            try {
                await this.contract.methods.buy(stock, amount, price).send(this.params);
            }
            catch (error) {
                console.log("TX FAILED: system currently paused...");
            }
        }

        this.setUsername = async (name) => {
            try {
                await contract.methods.setUsername(name).send(this.params);
            }
            catch (error) {}
        }

        this.submitOrder = async (type, stock, amount, price) => {
            if (type == "SELL") {
                await this.sell(stock, amount, price);
            }
            else if (type == "BUY") {
                await this.buy(stock, amount, price);
            }
            else {
                console.log("Invalid type order");
            }
        }

        this.submitDeposit = async (dest, stock, amount) => {
            if (stock == "TOKENS") {
                await this.add_tokens(dest, amount);
            }
            else {
                await this.add_stocks(dest, stock, amount);
            }
        }

        // GETTERS
        this.getUsername = async (acc) => {
            const ans = await this.contract.methods.getUsername(acc).call(this.params);
            return ans;
        }

        this.getWalletsTokens = async () => {
            const ans =  await this.contract.methods.getWalletsTokens().call(this.params);
            return ans;
        }

        this.getWalletsStocks = async () => {
            const stocks = await this.contract.methods.getStocks().call(this.params);
        
            const ans = [];
            for (var i = 0; i < stocks.length; i++) {
                var q = await this.contract.methods.getWalletsStocks(stocks[i]).call(this.params);
                if (q > 0) {
                    ans.push([stocks[i], q]);
                }
            }
            return ans;
        }

        this.getWalletsHistory = async (limit) => {
            const ans = await this.contract.methods.getWalletsHistory(limit).call(this.params);
            return ans;
        }

        this.getWalletsSellsInTransit = async () => {
            const ans = await this.contract.methods.getWalletsSellsInTransit().call(this.params);
            return ans;
        }

        this.getWalletsBuysInTransit = async () => {
            const ans = await this.contract.methods.getWalletsBuysInTransit().call(this.params);
            return ans;
        }

        this.getSellsInOrderBook = async (stock, limit) => {
            const ans = await contract.methods.getSellsInOrderBook(stock, limit).call(this.params);
            return ans;
        }

        this.getBuysInOrderBook = async (stock, limit) => {
            const ans = await contract.methods.getBuysInOrderBook(stock, limit).call(this.params);
            return ans;
        }

        this.refresh = async(stock, limit) => {
            this.username = await this.getUsername(this.account);
            this.walletsTokens = await this.getWalletsTokens();
            this.walletsStocks = await this.getWalletsStocks();
            this.history = await this.getWalletsHistory(limit);
            this.sellsInTransit = await this.getWalletsSellsInTransit();
            this.buysInTransit = await this.getWalletsBuysInTransit();
            this.sellsInOrderbook = await this.getSellsInOrderBook(stock, limit);
            this.buysInOrderbook = await this.getBuysInOrderBook(stock, limit);
        }

        this.pause = async() => {
            console.log("pausing...");
            await this.contract.methods.pause().send(this.params);
            const items = await this.contract.methods.getQueueSize().call(this.params);
            
            const perm = random_permutation(items);
            console.log("PERMUTATION: ", perm);

            console.log("executing...");
            const start = new Date();
            await this.contract.methods.execute(perm).send(this.params);
            const end = new Date();
            console.log("execution TOOK ", end-start);

            const matches = await this.contract.methods.getMatches().call(this.params);
            console.log("MATCHES: ", matches);
        }

        function random_permutation(items) {
            var perm = [], i, j, foo;
            for (i = 0; i < items; ++i) perm.push(i);

            for (i = items - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                foo = perm[i];
                perm[i] = perm[j];
                perm[j] = foo;
            }
            return perm;
        }
        
        this.restart = async() => {
            console.log("restarting...");
            await this.contract.methods.restart().send(this.params);
        }
    }
}

module.exports = API;
