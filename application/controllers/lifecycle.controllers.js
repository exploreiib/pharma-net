"use strict";

/**
 * This is a Node.JS module to register a new manufacturer and add new drug on the network.
 */

const {getContractInstance, disconnect} = require("../utils/contractHelper");


async function viewHistory(req,res) {
  try {
    console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
    
    let nameOfOrg = req.body.nameOfOrg;
    let drugName = req.body.drugName;
    let serialNo = req.body.serialNo;
    
    const pharmanetContract = await getContractInstance(nameOfOrg);

    // fetch history of given drug
    const historyBuffer = await pharmanetContract.submitTransaction("viewHistory", drugName, serialNo);

    let historyOfDrug = JSON.parse(historyBuffer.toString());
    const result = {
        status: "success",
        message: "historyOfDrug",
        historyOfDrug: historyOfDrug,
      };

    return res.json(result);

  } catch (error) {
    console.log(`\n\n ${error} \n\n`);
    const result = {
        status: "error",
        message: "Failed",
        error: error,
      };
      return res.status(500).send(result);
  } finally {
    // Disconnect from the fabric gateway
    console.log(".....Disconnecting from Fabric Gateway");
    disconnect();
  }
}


async function viewCurrentState(req,res) {
    try {
 
 
        let nameOfOrg = req.body.nameOfOrg;
        let drugName = req.body.companyCRN;
        let serialNo = req.body.companyName;
     
      const pharmanetContract = await getContractInstance(nameOfOrg);
  
      // fetch the current status of drug
      console.log(".....viewDrugCurrentState");
      const currentStateBuffer = await pharmanetContract.submitTransaction("viewDrugCurrentState", drugName, serialNo);

      let currentState = JSON.parse(currentStateBuffer.toString());
      const result = {
        status: "success",
        message: "currentState",
        currentState: currentState,
      };

      return res.json(result);

    } catch (error) {
      console.log(`\n\n ${error} \n\n`);
      const result = {
        status: "error",
        message: "Failed",
        error: error,
      };
      res.status(500).send(result);
    } finally {
      // Disconnect from the fabric gateway
      console.log(".....Disconnecting from Fabric Gateway");
      disconnect();
    }
  }
  
module.exports.viewHistory = viewHistory;
module.exports.viewCurrentState = viewCurrentState;
