const init = async (port, abi, networks) => {
    const web3 = new Web3("http://localhost:" + port);
    const id = await web3.eth.net.getId();
    const deployedNetwork = networks[id];
    const contract = new web3.eth.Contract(
        abi,
        deployedNetwork.address
    );
    
    const accounts = await web3.eth.getAccounts();
    return [contract, accounts];
}

const fill_up_table = (arr, titles) => {
    var t = "";

    t += "<thead> ";
    t += "<tr> ";
    for (var k = 0; k < titles.length; k++) {
        if (titles[k] == "not") continue;
        t += "<th> ";
        t += titles[k];
        t += " </th> ";
    }
    t += "</tr> ";
    t += "</thead> ";

    t += "<tbody>";
    for (var i = 0; i < arr.length; i++) {
        var tr = " <tr>";

        for (var k = 0; k < titles.length; k++) {
            if (titles[k] == "not") continue;
            tr += " <td> "+arr[i][k]+" </td> ";
        }
        tr += "</tr> ";
        t += tr;
    }
    t += "</tbody>";
    return t;
}