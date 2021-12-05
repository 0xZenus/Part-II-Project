pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

library info {
    enum OrderType {Buy, Sell}

    struct Deque {
        int begin;
        int end;
        uint total;
        mapping(int => uint) ind;
    }

    struct OrderQueue {
        int begin;
        int end;
        mapping(int => Order) ind;
    }

    struct Array {
        uint size;
        mapping(uint => uint) ind;
    }

    struct ArrayAddress {
        uint size;
        mapping(uint => address) ind;
    }

    struct Order {
        OrderType ot;
        address owner;
        string stock;
        uint amount;
        uint price;
    }

    struct Match {
        address source;
        address destination;
        string stock;
        uint amount;
        uint price;
    }

    struct ExplicitMatch {
        string source;
        string destination;
        string stock;
        uint amount;
        uint price;
    }

    struct Wallet {
        uint tokens;
        mapping(string => uint) stocks;
        Array SellsInTransit;
        Array BuysInTransit;
        Match[] history;
    }

    struct Identity {
        bool setTag;
        string tag;
    }
}

contract System {

    address bank;

    // any information about tags, identity, username: not involved in functionality
    mapping (address => info.Identity) tags;
    mapping (string => bool) takenTag;

    info.ArrayAddress latencyOrder;

    // currently traded stocks
    string[] existingStocks;
    mapping(string => bool) doesStockExist;

    function newStock(string memory stock) public {
        if (doesStockExist[stock]) return;
        doesStockExist[stock] = true;
        existingStocks.push(stock);
    }

    uint matches;

    // OrderBook: (string => ...) = (stock => ...)
    // for each stock: (string => ...)
    //    sells, buys: (uint => ...) = (price => ...) : for each price, keep the list of orders with that price
    //    sellPrices, buyPrices: list of prices currently trader for this stock
    mapping(string => mapping(uint => info.Deque)) sells;
    mapping(string => info.Deque) sellPrices;
    mapping(string => mapping(uint => info.Deque)) buys;
    mapping(string => info.Deque) buyPrices;

    // log of orders: orders[i] = the i-th order since the creation of the contract
    mapping(uint => info.Order) orders;
    mapping(uint => bool) validOrder;
    uint orderCounter;

    info.OrderQueue queue;

    // each trader: its wallet
    mapping(address => info.Wallet) wallets;

    constructor() public {
        bank = msg.sender;
        orderCounter = 0;
        takenTag[""] = true;
    }

    function pushSell(uint curr) public {
        string memory stock = orders[curr].stock;
        uint price = orders[curr].price;
        uint amount = orders[curr].amount;

        sells[stock][price].total += amount;

        // empty list: price does not exist
        if (sells[stock][price].begin >= sells[stock][price].end) {
            //push the price 

            sellPrices[stock].begin -= 1;
            sellPrices[stock].ind[sellPrices[stock].begin] = price;
            
            int it = sellPrices[stock].begin;
            while (it + 1 < sellPrices[stock].end && sellPrices[stock].ind[it] > sellPrices[stock].ind[it+1]) {
                uint tmp = sellPrices[stock].ind[it];
                sellPrices[stock].ind[it] = sellPrices[stock].ind[it+1];
                sellPrices[stock].ind[it+1] = tmp;

                it += 1;
            }
        }

        // append the order to the corresponding list
        validOrder[curr] = true;
        sells[stock][price].ind[sells[stock][price].end] = curr;
        sells[stock][price].end++;
    }

    function pushBuy(uint curr) public {
        string memory stock = orders[curr].stock;
        uint price = orders[curr].price;
        uint amount = orders[curr].amount;

        buys[stock][price].total += amount;

        // empty list: price does not exist
        if (buys[stock][price].begin >= buys[stock][price].end) { 
            //push the price 

            buyPrices[stock].begin -= 1;
            buyPrices[stock].ind[buyPrices[stock].begin] = price;

            int it = buyPrices[stock].begin;
            while (it + 1 < buyPrices[stock].end && buyPrices[stock].ind[it] < buyPrices[stock].ind[it+1]) {
                uint tmp = buyPrices[stock].ind[it];
                buyPrices[stock].ind[it] = buyPrices[stock].ind[it+1];
                buyPrices[stock].ind[it+1] = tmp;

                it += 1;
            }
        }

        // append the order to the corresponding list
        validOrder[curr] = true;
        buys[stock][price].ind[buys[stock][price].end] = curr;
        buys[stock][price].end++;
    }

    function performSell(address seller, string memory stock, uint amount, uint price) public {
        require(wallets[seller].stocks[stock] >= amount, "Insufficient stocks for sell");

        newStock(stock); // add stock if does not exist
        wallets[seller].stocks[stock] -= amount; // first charge seller with stocks

        orderCounter += 1;

        // try to immediately match this sell order with potential buy orders 
        while (amount > 0 && buyPrices[stock].begin < buyPrices[stock].end) {
            uint bestPrice = buyPrices[stock].ind[buyPrices[stock].begin];
            if (bestPrice < price) break; 

            while (amount > 0 && buys[stock][bestPrice].begin < buys[stock][bestPrice].end) {
                // match as much as possible 
                uint indBestBuy = buys[stock][bestPrice].ind[buys[stock][bestPrice].begin]; // index of this order
                info.Order memory bestBuy = orders[indBestBuy]; 
                address buyer = bestBuy.owner;

                // bestBuy.price >= price
                uint midPrice = (price + bestBuy.price) / 2;
                uint midAmount = (amount < bestBuy.amount) ? amount : bestBuy.amount;

                buys[stock][bestPrice].total -= midAmount;
                orders[indBestBuy].amount -= midAmount;
                amount -= midAmount;

                wallets[seller].tokens += midPrice * midAmount;
                wallets[buyer].tokens += (bestBuy.price - midPrice) * midAmount;
                wallets[buyer].stocks[stock] += midAmount;

                matches++;
                info.Match memory exc = info.Match(seller, buyer, stock, midAmount, midPrice);

                wallets[seller].history.push(exc);
                wallets[buyer].history.push(exc);

                if (orders[indBestBuy].amount == 0) {
                    validOrder[indBestBuy] = false;
                    buys[stock][bestPrice].begin++;
                    // emit OrderMatched(indBestBuy);
                }
            }

            if (buys[stock][bestPrice].begin >= buys[stock][bestPrice].end) {
                buyPrices[stock].begin += 1;
            }
        }

        if (amount > 0) {
            info.Order memory o = info.Order(info.OrderType.Sell, seller, stock, amount, price);
            orders[orderCounter] = o;
            pushSell(orderCounter);

            wallets[seller].SellsInTransit.ind[wallets[seller].SellsInTransit.size] = orderCounter;
            wallets[seller].SellsInTransit.size += 1;
        }
        else {
            // emit OrderMatched(orderCounter);
        }
    }

    function performBuy(address buyer, string memory stock, uint amount, uint price) public {
        require(wallets[buyer].tokens >= amount * price, "Insufficient tokens");

        newStock(stock); // add stock if does not exist
        wallets[buyer].tokens -= amount*price; // first charge buyer with tokens

        orderCounter += 1;

        while (amount > 0 && sellPrices[stock].begin < sellPrices[stock].end) {
            uint bestPrice = sellPrices[stock].ind[sellPrices[stock].begin];
            if (price < bestPrice) break;
    
            while (amount > 0 && sells[stock][bestPrice].begin < sells[stock][bestPrice].end) {
                uint indBestSell = sells[stock][bestPrice].ind[sells[stock][bestPrice].begin];
                info.Order memory bestSell = orders[indBestSell];
                address seller = bestSell.owner;

                // bestSell.price <= price
                uint midPrice = (bestSell.price + price) / 2;
                uint midAmount = (amount < bestSell.amount) ? amount : bestSell.amount;

                sells[stock][bestPrice].total -= midAmount;
                orders[indBestSell].amount -= midAmount;
                amount -= midAmount;

                wallets[seller].tokens += midPrice * midAmount;
                wallets[buyer].tokens += (price - midPrice) * midAmount;
                wallets[buyer].stocks[stock] += midAmount;

                matches++;
                info.Match memory exc = info.Match(seller, buyer, stock, midAmount, midPrice);
                // emit MatchEvent(seller, buyer, stock, midAmount, midPrice);

                wallets[seller].history.push(exc);
                wallets[buyer].history.push(exc);

                if (orders[indBestSell].amount == 0) {
                    validOrder[indBestSell] = false;
                    sells[stock][bestPrice].begin++;
                    // emit OrderMatched(indBestSell);
                }
            }

            if (sells[stock][bestPrice].begin >= sells[stock][bestPrice].end) {
                sellPrices[stock].begin += 1;
            }
        }

        if (amount > 0) {
            info.Order memory o = info.Order(info.OrderType.Buy, buyer, stock, amount, price);
            orders[orderCounter] = o;
            pushBuy(orderCounter);

            wallets[buyer].BuysInTransit.ind[wallets[buyer].BuysInTransit.size] = orderCounter;
            wallets[buyer].BuysInTransit.size += 1;
        }
        else {
            // emit OrderMatched(orderCounter);
        }
    }

    bool paused;
    function pause() public {
        require(msg.sender == bank);
        paused = true;
    }

    function getQueueSize() view public returns (int) {
        return queue.end - queue.begin;
    }

    function getMatches() view public returns (uint) {
        return matches;
    }

    function execute(int[] memory rp) public {
        require(msg.sender == bank);
        require(paused == true);

        info.Order memory o;
        for (uint it = 0; it < rp.length; ++it) {
            int j = rp[it];
            o = queue.ind[queue.begin + j];

            if (o.ot == info.OrderType.Sell) {
                performSell(o.owner, o.stock, o.amount, o.price);
            }
            else {
                performBuy(o.owner, o.stock, o.amount, o.price);
            }
        }
        queue.begin = queue.end;
    }

    function restart() public { 
        require(msg.sender == bank);
        paused = false;
    }

    function sell(string memory stock, uint amount, uint price) public {
        require(paused == false, "System currently paused");
        info.Order memory raw = info.Order(info.OrderType.Sell, msg.sender, stock, amount, price);
        queue.ind[queue.end] = raw;
        queue.end++;
    }

    function buy(string memory stock, uint amount, uint price) public {
        require(paused == false, "System currently paused");
        info.Order memory raw = info.Order(info.OrderType.Buy, msg.sender, stock, amount, price);
        queue.ind[queue.end] = raw;
        queue.end++;
    }

    function add_tokens(address to, uint amount) public {
        require(msg.sender == bank, "Not a bank");
        wallets[to].tokens += amount;
    }

    function add_stocks(address to, string memory stock, uint amount) public {
        require(msg.sender == bank, "Not a bank");
        newStock(stock); // add stock if does not exist
        wallets[to].stocks[stock] += amount;
    }

    function setUsername(string memory name) public {
        require(takenTag[name] == false, "Already existing tag");
        if (tags[msg.sender].setTag) {
            takenTag[tags[msg.sender].tag] = false;
        }
        takenTag[name] = true;
        tags[msg.sender].tag = name;
        tags[msg.sender].setTag = true;
    }

    // GETTERS

    function getUsername(address account) public view returns (string memory) {
        if (account == bank) return "Bank"; 
        return (tags[account].setTag) ? tags[account].tag : "Undefined";
    }

    function getWalletsTokens() public view returns (uint) {
        return wallets[msg.sender].tokens;
    }

    function getWalletsStocks(string memory stock) public view returns(uint) {
        return wallets[msg.sender].stocks[stock];
    }

    function getWalletsHistory(uint k) public view returns(info.Match[] memory) {
        uint size = wallets[msg.sender].history.length;
        uint limit = (k == 0) ? size : (k < size) ? k : size;
        
        info.ExplicitMatch[] memory history = new info.ExplicitMatch[](limit);
        for (uint i = 0; i < limit; i++) {
            history[i].source = getUsername(wallets[msg.sender].history[i].source);
            history[i].destination = getUsername(wallets[msg.sender].history[i].destination);
            history[i].stock = wallets[msg.sender].history[i].stock;
            history[i].amount = wallets[msg.sender].history[i].amount;
            history[i].price = wallets[msg.sender].history[i].price;
        }

        return wallets[msg.sender].history;
    }

    function getWalletsSellsInTransit() public view returns(info.Order[] memory) {
        uint valids = 0;
        for (uint i = 0; i < wallets[msg.sender].SellsInTransit.size; i++) {
            if (validOrder[wallets[msg.sender].SellsInTransit.ind[i]]) {
                valids += 1;
            }
        }

        info.Order[] memory ords = new info.Order[](valids);

        uint it = 0;
        for (uint i = 0; i < wallets[msg.sender].SellsInTransit.size; i++) {
            if (validOrder[wallets[msg.sender].SellsInTransit.ind[i]]) {
                ords[it] = orders[wallets[msg.sender].SellsInTransit.ind[i]];
                it += 1;
            }
        }
        return ords;
    }

    function getWalletsBuysInTransit() public view returns(info.Order[] memory) {
        uint valids = 0;
        for (uint i = 0; i < wallets[msg.sender].BuysInTransit.size; i++) {
            if (validOrder[wallets[msg.sender].BuysInTransit.ind[i]]) {
                valids += 1;
            }
        }

        info.Order[] memory ords = new info.Order[](valids);

        uint it = 0;
        for (uint i = 0; i < wallets[msg.sender].BuysInTransit.size; i++) {
            if (validOrder[wallets[msg.sender].BuysInTransit.ind[i]]) {
                ords[it] = orders[wallets[msg.sender].BuysInTransit.ind[i]];
                it += 1;
            }
        }
        return ords;
    }

    function getSellsInOrderBook(string memory stock, uint noPrices) public view returns(info.Order[] memory) {
        uint size = (uint)(sellPrices[stock].end - sellPrices[stock].begin);
        uint k = (noPrices < size) ? noPrices : size;

        info.Order[] memory ords = new info.Order[](k);

        for (uint i = 0; i < k; i++) {
            ords[i].price = sellPrices[stock].ind[sellPrices[stock].begin + (int)(i)];
            ords[i].amount = sells[stock][ords[i].price].total;
            ords[i].stock = stock;
        }
        return ords;
    }

    function getBuysInOrderBook(string memory stock, uint noPrices) public view returns(info.Order[] memory) {
        uint size = (uint)(buyPrices[stock].end - buyPrices[stock].begin);
        uint k = (noPrices < size) ? noPrices : size;

        info.Order[] memory ords = new info.Order[](k);

        for (uint i = 0; i < k; i++) {
            ords[i].price = buyPrices[stock].ind[buyPrices[stock].begin + (int)(i)];
            ords[i].amount = buys[stock][ords[i].price].total;
            ords[i].stock = stock;
        }
        return ords;
    }

    function getStocks() public view returns(string[] memory) {
        return existingStocks;
    }

    // optional: debugging purpose

    function getSellPrices(string memory stock) public view returns(uint[] memory) {
        uint size = (uint)(sellPrices[stock].end - sellPrices[stock].begin);
        uint[] memory ret = new uint[](size);

        for (uint i = 0; i < size; ++i) {
            ret[i] = sellPrices[stock].ind[sellPrices[stock].begin + (int)(i)];
        }
        return ret;
    }
    
}