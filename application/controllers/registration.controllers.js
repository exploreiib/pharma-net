"use strict";

/**
 * This is a Node.JS module to register a new manufacturer and add new drug on the network.
 */

const {getContractInstance, disconnect} = require("../utils/contractHelper");


async function registerCompany(req,res) {
  try {
    console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
    
    let nameOfOrg = req.body.nameOfOrg;
    let companyCRN = req.body.companyCRN;
    let companyName = req.body.companyName;
    let location = req.body.location;
    let organisationRole = req.body.organisationRole;

    const pharmanetContract = await getContractInstance(nameOfOrg);

    // register new company
    console.log(".....Resister New Company");
    const registeredCompanyBuffer = await pharmanetContract.submitTransaction(
      "registerCompany",
      companyCRN,
      companyName,
      location,
      organisationRole
    );

    // process response
    console.log(".....Processing Register New Comapny Transaction Response \n\n");
    let newCompany = JSON.parse(registeredCompanyBuffer.toString());
    console.log(newCompany);
    console.log("\n\n.....Register New Company Transaction Complete!");

    const result = {
      status: "success",
      message: "New Company got registered",
      newCompany: newCompany,
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


async function addDrug(req,res) {
    try {
 
 
        let nameOfOrg = req.body.nameOfOrg;
        let drugName = req.body.companyCRN;
        let serialNo = req.body.companyName;
        let mfgDate = req.body.location;
        let expDate = req.body.organisationRole;
        let companyCRN = req.body.companyCRN;
    
     
      const pharmanetContract = await getContractInstance(nameOfOrg);
  
      // register new drug
      console.log(".....Resister New Drug");
      const addDrugBuffer = await pharmanetContract.submitTransaction(
        "addDrug",
        drugName,
        serialNo,
        mfgDate,
        expDate,
        companyCRN
      );
      console.log("Add New drug Transaction Response" + addDrugBuffer);
      // process response
      console.log(".....Processing Add New drug Transaction Response \n\n");
      let newDrug = JSON.parse(addDrugBuffer.toString());
      console.log(newDrug);
      console.log("\n\n.....Register New Drug Transaction Complete!");
      const result = {
        status: "success",
        message: "New Drug got registered",
        newDrug: newDrug,
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
  
module.exports.registerCompany = registerCompany;
module.exports.addDrug = addDrug;
