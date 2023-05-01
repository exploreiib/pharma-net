"use strict";

/**
 * This is a Node.JS module to transfer drug related transactions.
 */

const {getContractInstance, disconnect} = require("../utils/contractHelper");


async function createPO(req,res) {
  try {
    console.log("Inside createPO req=> " + JSON.stringify(req.body.companyCRN));
    
    let nameOfOrg = req.body.nameOfOrg;
    let buyerCRN =  req.body.buyerCRN;
    let sellerCRN = req.body.sellerCRN;
    let drugName = req.body.drugName;
    let quantity =  req.body.quantity;

    const pharmanetContract = await getContractInstance(nameOfOrg);

    // register new company
    console.log(".....Creating a PO");
    const purchaseOrderBuffer = await pharmanetContract.submitTransaction(
      "createPO",
      buyerCRN,
      sellerCRN,
      drugName,
      quantity
    );

    // process response
    console.log(".....Processing Register New PO Transaction Response \n\n");
    let newPurchaseOrder = JSON.parse(purchaseOrderBuffer.toString());
    console.log(newPurchaseOrder);
    console.log("\n\n.....Register New PO Transaction Complete!");

    const result = {
      status: "success",
      message: "New PO got registered",
      newPurchaseOrder: newPurchaseOrder,
    };
    return res.json(result);

  } catch (error) {
    console.log(` Error during createPO: \n\n ${error} \n\n`);
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


async function createShipment(req,res) {
    try {
 
      let nameOfOrg = req.body.nameOfOrg;
      let drugName = req.body.drugName;
      let buyerCRN = req.body.buyerCRN;
      let listOfAssets = req.body.listOfAssets;
      let transporterCRN = req.body.transporterCRN;
    
     
      const pharmanetContract = await getContractInstance(nameOfOrg);
  
      // register new drug
      console.log(".....Creating a Shipment");
      const shipmentBuffer = await pharmanetContract.submitTransaction(
        "createShipment",
        buyerCRN,
        drugName,
        listOfAssets,
        transporterCRN
      );
  
      // process response
      console.log(".....Processing Shipment Transaction Response \n\n");
      let newShipment = JSON.parse(shipmentBuffer.toString());
      console.log(newShipment);
      console.log("\n\n.....Register New Shipment Transaction Complete!");

      const result = {
        status: "success",
        message: "New Shipment got registered",
        newShipment: newShipment,
      };
      return res.json(result);
  
    } catch (error) {
      console.log(`Error during createShipment: \n\n ${error} \n\n`);
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

  async function updateShipment(req,res) {
    try {
 
      let nameOfOrg = req.body.nameOfOrg;
      let drugName = req.body.drugName;
      let buyerCRN = req.body.buyerCRN;
      let transporterCRN = req.body.transporterCRN;

      const pharmanetContract = await getContractInstance(nameOfOrg);
   
      console.log(".....Updating  a Shipment");
      const updateShipmentBuffer = await pharmanetContract.submitTransaction(
        "updateShipment",
        buyerCRN,
        drugName,
        transporterCRN
      );
  
      // process response
      console.log(".....Processing Updated Shipment Transaction Response \n\n");
      let newUpdatedShipment = JSON.parse(updateShipmentBuffer.toString());
      console.log(newUpdatedShipment);
      console.log("\n\n.....Register New Updated Shipment Transaction Complete!");
  
      const result = {
        status: "success",
        message: "New Updated Shipment got registered",
        newUpdatedShipment: newUpdatedShipment,
      };
      return res.json(result);
  
    } catch (error) {
      console.log(`Error during updateShipment:\n\n ${error} \n\n`);
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

  async function retailDrug(req,res) {
    try {
 
      let nameOfOrg = req.body.nameOfOrg;
      let drugName = req.body.drugName;
      let serialNo = req.body.serialNo;
      let retailerCRN = req.body.retailerCRN;
      let customerAadhar = req.body.customerAadhar;

      const pharmanetContract = await getContractInstance(nameOfOrg);
   
      console.log(".....Retailing  a Drug");
      const retailBuffer = await pharmanetContract.submitTransaction(
        "retailDrug",
        drugName,
        serialNo,
        retailerCRN,
        customerAadhar
      );
  
      // process response
      console.log(".....Processing retailDrug Transaction Response \n\n");
      let newPurchase = JSON.parse(retailBuffer.toString());
      console.log(newPurchase);
      console.log("\n\n.....retailDrug Transaction Complete!");
      
      const result = {
        status: "success",
        message: "New Purchase from customer",
        newPurchase: newPurchase,
      };
      return res.json(result);
  
    } catch (error) {
      console.log(`Error during retailDrug:\n\n ${error} \n\n`);
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
  
module.exports.createPO = createPO;
module.exports.createShipment = createShipment;
module.exports.updateShipment = updateShipment;
module.exports.retailDrug = retailDrug;
