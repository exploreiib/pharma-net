"use strict";

/**
 * This is a Node.JS application to register a new manufacturer on the network.
 */

const fs = require("fs");
const yaml = require("js-yaml");
const { FileSystemWallet, Gateway } = require("fabric-network");
const { getIdentityPath,
        getConnectionProfilePath,
        getFabricUserName } = require("../constants/constant");

let gateway;
let wallet;

async function getContractInstance(nameOfOrg) {
  // A gateway defines which peer is used to access Fabric network
  // It uses a common connection profile (CCP) to connect to a Fabric Peer
  // A CCP is defined manually in file connection-profile-mhrd.yaml
  gateway = new Gateway();
  wallet = new FileSystemWallet(getIdentityPath(nameOfOrg));

  // What is the username of this Client user accessing the network?
  let fabricUserName = getFabricUserName(nameOfOrg);

  // Load connection profile; will be used to locate a gateway; The CCP is converted from YAML to JSON.
  let connectionProfile = yaml.safeLoad(fs.readFileSync(getConnectionProfilePath(nameOfOrg), "utf8"));


  // Set connection options; identity and wallet
  let connectionOptions = {
    wallet: wallet,
    identity: fabricUserName,
    discovery: { enabled: false, asLocalhost: true },
  };

  // Connect to gateway using specified parameters
  console.log(".....Connecting to Fabric Gateway");
  await gateway.connect(connectionProfile, connectionOptions);

  // Access certification channel
  console.log(".....Connecting to channel - pharmachannel");
  const channel = await gateway.getNetwork("pharmachannel");

  // Get instance of deployed Certnet contract
  // @param Name of chaincode
  // @param Name of smart contract
  console.log(".....Connecting to Certnet Smart Contract");
  return channel.getContract("pharmanet", "org.drug-counterfeit.pharmanet");
}

function disconnect() {
    console.log(".....Disconnecting from Fabric Gateway");
    gateway.disconnect();
  }
  
module.exports.getContractInstance = getContractInstance;
module.exports.disconnect = disconnect;
