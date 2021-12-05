var SimpleStorage = artifacts.require("SimpleStorage");
var System = artifacts.require("System");
var NoBatchingSystem = artifacts.require("NoBatchingSystem");
var Timing = artifacts.require("Timing");

module.exports = function(deployer) {
  // deployer.deploy(SimpleStorage, 0);
  deployer.deploy(System);
  deployer.deploy(Timing);
  // deployer.deploy(NoBatchingSystem);
};
