"use strict";

// Importing Dependencies
const { Contract } = require("fabric-contract-api");
const ClientIdentity = require("fabric-shim").ClientIdentity;
const keys = require("./keys")

// Common function to read any asset ,using given input key from the network
// if asset doesn't exist on network, then error will be thrown
async function readState(ctx, id) {
	const assetBuffer = await ctx.stub.getState(id); // get the asset from chaincode state
	if (!assetBuffer || assetBuffer.length === 0) {
		throw new Error(`The asset with ${id} does not exist`);
	}
	const assetString = assetBuffer.toString();
	const asset = JSON.parse(assetString);

	return asset;
}

// Common function to write any asset ,using given input key to the network
async function writeState(ctx, id,asset) {
  let assetDataBuffer = Buffer.from(JSON.stringify(asset));
  await ctx.stub.putState(id, assetDataBuffer);
	return asset;
}

// Common function to read complete composite key attributes ,using given input key & attribute value
// if asset doesn't exist on network, then error will be thrown

async function retrieveAllCompositeKeyAttributes(ctx,compositeKeyId,lookupAttributeName,lookupAttributeVal) {
  let resultsIterator = await ctx.stub.getStateByPartialCompositeKey(compositeKeyId, [
    lookupAttributeVal,
  ]);

  // Iterate through result set and for each result found.
  var valueFound = false;
  while (!valueFound) {
    let responseRange = await resultsIterator.next();

    if (!responseRange || !responseRange.value || !responseRange.value.key) {
      throw new Error(`Invalid ${lookupAttributeName}`);
    }

    valueFound = true;
    let objectType;
    let attributes;
    ({ objectType, attributes } = await ctx.stub.splitCompositeKey(responseRange.value.key));
    
    return attributes;

  }
}

class PharmanetContract extends Contract {
  // Default constructor method
  constructor() {
    // Provide a custom name to refer to this smart contract
    super("org.drug-counterfeit.pharmanet");
  }

  /* ****** Contract Functions - Starts ***** */

  // This is a basic user defined function used at the time of instantiating the smart contract
  // to print the success message on console
  async instantiate(ctx) {
    console.log("Pharmanet Smart Contract Instantiated Super successful");
  }

  
  /******* Part 1 - Entity Registration ***** */
  /**
   * Register Company -  Used to register new entities on the ledger
   * @param ctx - The transaction Context object
   * @param companyCRN - The Company Registration Number (should use for forming companyID) 
   * @param companyName - Name of the company (should use for forming companyID) 
   * @param location - Location of the company
   * @param organisationRole - Role of the organization Manufacturer/Distributor/Retailer/Transporter
   * @returns companyObject that's saved to the ledger   
   */

  async registerCompany(ctx, companyCRN, companyName, location, organisationRole) {
    console.log("Registering the company " + companyName);

    let cid = new ClientIdentity(ctx.stub);
    let mspID = cid.getMSPID();

    console.log("MSPID of the transaction initiator is=> " + mspID);

    // All participants other than consumer can register the company
    if ("consumerMSP" !== mspID) {
      const companyID = await ctx.stub.createCompositeKey(keys.companyNameSpace(), [companyCRN, companyName]);

      //Check for the role and assaign hierarchyKey accordingly
      if (
        organisationRole !== "Manufacturer" &&
        organisationRole !== "Distributor" &&
        organisationRole !== "Retailer" &&
        organisationRole !== "Transporter"
      ) {
        return "Invalid Organisation Role";
      } else {
        let hierarchyKey;
        if (organisationRole === "Manufacturer") {
          hierarchyKey = "1";
        } else if (organisationRole === "Distributor") {
          hierarchyKey = "2";
        } else if (organisationRole === "Retailer") {
          hierarchyKey = "3";
        } else if (organisationRole === "Transporter") {
          hierarchyKey = "";
        }

        let companyObject = {
          companyID: companyID,
          name: companyName,
          location: location,
          organisationRole: organisationRole,
          hierarchyKey: hierarchyKey,
          createdAt: new Date(),
        };
        await writeState(ctx,companyID,companyObject);
        return companyObject;
      }
    }
  }

  /******* Part 2 - Drug Registration ***** */
  
  /**
   * Add Drug  - Used by any organisation registered as a ‘manufacturer’ to register a new drug on the ledger. 
   * @param ctx - The transaction Context object
   * @param drugName - Name of the product
   * @param serialNo - Serial number of the drug
   * @param mfgDate - Date of manufacturer of the drug
   * @param expDate - Expiry date of the drug
   * @param companyCRN - The Company Registration Number 

   * @returns drugObject that's saved to the ledger   
   */
  async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN) {
    
    //Validate if manufacture org should only add new drug to the ledger
    let cid = new ClientIdentity(ctx.stub);
    let mspID = cid.getMSPID();
    if(! ("manufacturerMSP" === mspID)){
        throw new Error(`No one can add a drug but Manufacturer.`);
    }

    
    let companyAttributes = await retrieveAllCompositeKeyAttributes(ctx,
                                                                    keys.companyNameSpace(),
                                                                    "companyCRN",
                                                                    companyCRN,
                                                                  );
    let returnedCompanyCRN = companyAttributes[0];
    let returnedCompanyName = companyAttributes[1];

    //generate key of the drug owner
    const generateKeyDrugOwner = await ctx.stub.createCompositeKey(keys.companyNameSpace(), [
        returnedCompanyCRN,
        returnedCompanyName,
    ]);

    
    const productID = await ctx.stub.createCompositeKey(keys.drugNameSpace(), [drugName, serialNo]);

    //create the drug object to store on the ledger
    let drugObject = {
          productID: productID,
          name: drugName,
          manufacturer: generateKeyDrugOwner,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          owner: generateKeyDrugOwner,
          shipment: "",
    };

    await writeState(ctx,productID,drugObject);
    return drugObject;      
  }


  /* ****** Part 3 - Transfer Drug Functions - Starts ***** */
  
  /**
   * createPO  - Used to create a Purchase Order (PO) to buy drugs, by companies belonging to ‘Distributor’ or ‘Retailer’ organisation. 
   * @param ctx - The transaction Context object
   * @param buyerCRN - The Company Registration Number of Buyer
   * @param sellerCRN - The Company Registration Number of Seller
   * @param drugName - Contains the name of the drug for which the PO is raised
   * @param quantity - Denotes the number of units required
   * @returns either purchaseOrderObject that's saved to the ledger or validation error message ,incase of validation errors   
   */

  async createPO(ctx, buyerCRN, sellerCRN, drugName, quantity) {
    //Check the initiator of the transaction is ‘Distributor’ or ‘Retailer’
    let cid = new ClientIdentity(ctx.stub);

    let mspID = cid.getMSPID();

    console.log(
      "buyerCRN is=>" + buyerCRN + "sellerCRN=> " + sellerCRN + "drugName=> " + drugName + "quantity=>" + quantity
    );

    if ("retailerMSP" !== mspID && "distributorMSP" !== mspID) {
      throw new Error(`Sorry! Only Distributor and Retailer can create a purchase request!`);
    } 

    // proceed further to validate for the hierarchy

    let buyerCompanyAttributes = await retrieveAllCompositeKeyAttributes(ctx,
      keys.companyNameSpace(),
      "Buyer companyCRN",
      buyerCRN,
     );

    let returnedBuyerCompanyCRN = buyerCompanyAttributes[0];
    let returnedBuyerCompanyName = buyerCompanyAttributes[1];
      
    var generateBuyerCompanyID = await ctx.stub.createCompositeKey(keys.companyNameSpace(), [
        returnedBuyerCompanyCRN,
        returnedBuyerCompanyName,
    ]);

    const buyerData = await readState(ctx, generateBuyerCompanyID);
    console.log("buyerData=> " + buyerData);
  
  

    //Fetch the Seller company details from ledger
    let sellerCompanyAttributes = await retrieveAllCompositeKeyAttributes(ctx,
      keys.companyNameSpace(),
      "Seller companyCRN",
      sellerCRN,
    );

    let returnedSellerCompanyCRN = sellerCompanyAttributes[0];
    let returnedSellerCompanyName = sellerCompanyAttributes[1];

    var generateSellerCompanyID = await ctx.stub.createCompositeKey(keys.companyNameSpace(), [
      returnedSellerCompanyCRN,
      returnedSellerCompanyName,
    ]);

    const sellerData = await readState(ctx, generateSellerCompanyID);
    console.log("sellerData=> " + sellerData.organisationRole);

    //Check for purchase hierachy
    if (buyerData.organisationRole === "Retailer") {
      console.log("Retailer can purchase only from Distributor");
      if (!(sellerData.organisationRole === "Distributor")) {
        console.log("Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
        throw new Error(`Sorry! ${buyerData.organisationRole} can't purchase from ${sellerData.organisationRole}`);      
      }
      //All Good, Create a purchase request
      console.log("All Good, Create a purchase request");
      // CRN number of the buyer and Drug Name, along with an appropriate namespace.
      const poID = await ctx.stub.createCompositeKey(keys.poNameSpace(), [buyerCRN, drugName]);

      //create the drug object to store on the ledger
      let purchaseOrderObject = {
          poID: poID,
          drugName: drugName,
          quantity: quantity,
          buyer: generateBuyerCompanyID,
          seller: generateSellerCompanyID,
      };

      console.log("purchaseOrderObject created is==> " + purchaseOrderObject);

      await writeState(ctx,poID,purchaseOrderObject);
      return purchaseOrderObject;
      
    } else if (buyerData.organisationRole === "Distributor") {
      console.log("Distributor can purchase only from Manufacturer");
      if (!(sellerData.organisationRole === "Manufacturer")) {
        console.log("Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
        throw new Error(`Sorry! ${buyerData.organisationRole} can't purchase from ${sellerData.organisationRole}`);      
      }  
      //Validations are Good, Create a purchase request
      console.log("All Good, Create a purchase request");
      const poID = await ctx.stub.createCompositeKey(keys.poNameSpace(), [buyerCRN, drugName]);

      //create the drug object to store on the ledger
      let purchaseOrderObject = {
          poID: poID,
          drugName: drugName,
          quantity: quantity,
          buyer: generateBuyerCompanyID,
          seller: generateSellerCompanyID,
      };

      console.log("purchaseOrderObject created is==> " + purchaseOrderObject);
      await writeState(ctx,poID,purchaseOrderObject);
      return purchaseOrderObject;
      
    } else {
      console.log(buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
      throw new Error(`${buyerData.organisationRole}  can't purchase from ${sellerData.organisationRole}`);      
    }
  }

  /**
   * createShipment  - Transport the consignment via a transporter corresponding to each PO
   * @param ctx - The transaction Context object
   * @param buyerCRN - The Company Registration Number of Buyer
   * @param drugName - Contains the name of the drug for which the PO is raised
   * @param listOfAssets - String of comma seperated serial numbers of the drug  
   * @param transporterCRN - The Company Registration Number of Transporter
   * @returns either shipmentObject that's saved to the ledger or validation error message ,incase of validation errors   
   */
  async createShipment(ctx, buyerCRN, drugName, listOfAssets, transporterCRN) {
   
    //var listOfAssets = JSON.parse(listOfAssetsStr);
    //var listOfAssetsLength = listOfAssets.length;

    let listFromCommandLine = JSON.parse(listOfAssets);//listOfAssets.split(",");
    let listOfAssetsLength = listFromCommandLine.length;

    //Get the PO associated with the buyerCRN
    const poID = await ctx.stub.createCompositeKey(keys.poNameSpace(), [buyerCRN, drugName]);

    
    //Get the purchase order
    var parsedPurchaseOrder = await readState(ctx,poID);
    //let buyerPurchaseBuffer = await ctx.stub.getState(generatePOID).catch((err) => console.log(err));
    //let parsedPurchaseOrder = JSON.parse(buyerPurchaseBuffer.toString());

    //Check Validation 1-listOfAssets should be exactly equal to the quantity speified in the PO
    if (!(listOfAssetsLength == parsedPurchaseOrder.quantity)){
      console.log(
          "listOfAssetsLength is " +
          listOfAssetsLength +
          " and " +
          "parsedPurchaseOrder.quantity " +
          parsedPurchaseOrder.quantity +
          " length DOES NOT matches"
      );
      console.log("Sorry! Can'tProceed!");
      
      throw new Error(`listOfAssetsLength is ${listOfAssetsLength} and  parsedPurchaseOrder.quantity 
                      ${parsedPurchaseOrder.quantity} length DOES NOT matches. Sorry! Can'tProceed!`);      

    }
    
    //Check Validation 2
    //The IDs of the drug should be valid ID which are registered on the network.
    var validDrugId = true;
    var listOfCompositeKeysForDrugs = [];
    for (let i = 0; i < listFromCommandLine.length; i++) {
      if (validDrugId) {
        //Using the serialnumber and drugName get the details of the drug.
        let serialnumberOfTheDrug = listFromCommandLine[i];
        let productID = await ctx.stub.createCompositeKey(keys.drugNameSpace(), [drugName,serialnumberOfTheDrug]);

        try {
              await readState(ctx,productID);
              validDrugId = true;
              listOfCompositeKeysForDrugs.push(productID);
          } catch (err) {
              validDrugId = false;
            }
          }
      }
      
      if(!validDrugId)
        throw new Error("Sorry the drug is not registered with the network");

      const shipmentID = await ctx.stub.createCompositeKey(keys.shipmentNameSpace(), [
                                                      buyerCRN,
                                                      drugName
                                                    ]);

      //Transporter compositeKey
      let transporterAttributes = await retrieveAllCompositeKeyAttributes(ctx,
        keys.companyNameSpace(),
        "transporterCRN",
        transporterCRN
      );
  
  
      let returnedTransporterCompanyCRN = transporterAttributes[0];
      let returnedTransporterCompanyName = transporterAttributes[1];

      console.log("returnedTransporterCompanyName=> " + returnedTransporterCompanyName);
      console.log("returnedTransporterCompanyCRN=> " + returnedTransporterCompanyCRN);

      var generateTransporterCompanyID = await ctx.stub.createCompositeKey(
                                                   keys.companyNameSpace(),
                                                   [returnedTransporterCompanyCRN, 
                                                    returnedTransporterCompanyName
                                                   ]
                                                );

        console.log("Transporter composite key created=> " + generateTransporterCompanyID);
        
      //Update the status as "in-transit"
      let shipmentObject = {
            shipmentID: shipmentID,
            creator: ctx.clientIdentity.getID(),
            assets: listOfCompositeKeysForDrugs,
            transporter: generateTransporterCompanyID,
            status: "in-transit",
      };

      await writeState(ctx,shipmentID, shipmentObject);
      let shipmentResponseObject = [];
      //Owner of each batch should be updated
      for (let i = 0; i <= listOfCompositeKeysForDrugs.length - 1; i++) {
        //Find the drug details using composite key
        let jsonDrugDetail = await readState(ctx,listOfCompositeKeysForDrugs[i]);
        console.log("jsonDrugDetail owner=> " + jsonDrugDetail.owner);
        console.log("jsonDrugDetail manufacturer=> " + jsonDrugDetail.manufacturer);
        //Owner is now transporter, so transporter composite key is the owner
        jsonDrugDetail.owner = generateTransporterCompanyID;
        //Once you have updated the owner of the drug put the state back to the drug
        await writeState(ctx,listOfCompositeKeysForDrugs[i], jsonDrugDetail);
        shipmentResponseObject.push(jsonDrugDetail);
      }

      return shipmentResponseObject;
      
  }

  /**
   * updateShipment  -  Update the status of the shipment to ‘Delivered’ when the consignment gets delivered to the destination.
   * @param ctx - The transaction Context object
   * @param buyerCRN - The Company Registration Number of Buyer
   * @param drugName - Contains the name of the drug for which the PO is raised
   * @param transporterCRN - The Company Registration Number of Transporter
   * @returns either shipmentObject that's saved to the ledger or validation error message ,incase of validation errors   
   */
  async updateShipment(ctx, buyerCRN, drugName, transporterCRN) {
    //Validation1 - Should be invoked only by the transporter of the shipment
    //Using transporterCRN get shipmentObject object. If the shipmentObject exists then it's a valid transporter else he is not valid transporter
    let transporterAttributes = await retrieveAllCompositeKeyAttributes(ctx,
      keys.companyNameSpace(),
      "transporterCRN",
      transporterCRN,
    );
    let transportForUpdateShipmentCRN = transporterAttributes[0];
    let transportForUpdateShipmentName = transporterAttributes[1];

    //create transporter composite key
    var generateTransporterForShipmentUpdation = await ctx.stub.createCompositeKey(
      keys.companyNameSpace(),
      [transportForUpdateShipmentCRN, transportForUpdateShipmentName]
    );

    console.log("this is the generated transporter composite key=>" + generateTransporterForShipmentUpdation);

    //if (transportForUpdateShipmentCRN === transporterCRN) {
    //  console.log("Registered transporter");
      //create the composite key of the shipment using buyerCRN and drugName
    let generatedShipmentCompositeKey = await ctx.stub.createCompositeKey(keys.shipmentNameSpace(), [
        buyerCRN,
        drugName,
    ]);

    let parsedShipmentData = await readState(ctx,generatedShipmentCompositeKey);
    console.log("transporter composite key what sin shipment=> " + parsedShipmentData.transporter);
    console.log("generated transporter=>" + generateTransporterForShipmentUpdation);
    
    //Validate, the function hould be invoked only by the transporter of the shipment  
    if (!(parsedShipmentData.transporter === generateTransporterForShipmentUpdation)) {
      console.log(`Transporter on shipment record ${parsedShipmentData.transporter} doesn't match with 
                   trnasporter ${generateTransporterForShipmentUpdation} intiated the update transaction `);
      throw new Error(`Transporter on shipment record ${parsedShipmentData.transporter} doesn't match with
                      trnasporter ${generateTransporterForShipmentUpdation} intiated the update transaction `)
    }    
    
    console.log("All good!transporter match");

    //status of the shipment changed to delivered.
    parsedShipmentData.status = "delivered";

    //Once you have updated the owner of the drug put the state back to the drug
    //Wait untill you get the successfully delivered response, then display. Else the status will be in still "in-transit"
    await writeState(ctx,generatedShipmentCompositeKey, parsedShipmentData);
    console.log("Shipment object's status has been changed");

    //shipment field in the add drug method should be changed.
    //shipment field will have a value "generatedShipmentCompositeKey"-vmpharmaParacematamol

    //Buyer compositeKey
    let buyerCompanyAttributes = await retrieveAllCompositeKeyAttributes(ctx,
      keys.companyNameSpace(),
      "buyerCRN",
      buyerCRN,
    );
    let returnedBuyerCompanyCRNForOwner = buyerCompanyAttributes[0];
    let returnedBuyerCompanyNameForOwner = buyerCompanyAttributes[1];
    console.log("returnedBuyerCompanyNameForOwner=> " + returnedBuyerCompanyNameForOwner);
    console.log("returnedBuyerCompanyCRNForOwner=> " + returnedBuyerCompanyCRNForOwner);
    
    let generateBuyerCompanyIDForOwner = await ctx.stub.createCompositeKey(
          keys.companyNameSpace(),
          [returnedBuyerCompanyCRNForOwner, returnedBuyerCompanyNameForOwner]
    );

    console.log("Buyer composite key created=> " + generateBuyerCompanyIDForOwner);
    let shimentObject = [];
    //Iterate through the drug list in the shipment and
    let drugsInShipment = parsedShipmentData.assets;
    for (let i = 0; i <= drugsInShipment.length - 1; i++) {
      console.log(drugsInShipment[i]);
      let drugCompositeKeyID = drugsInShipment[i];

      //For each drug get the drugObject and update the shipment with

      //The below is the drug object for which you have to change the shipemnt field with the composite key generatedShipmentCompositeKey

      //change the owner of the drug - buyerCRN
      console.log("drugCompositeKeyID is=> " + drugCompositeKeyID);
      let JSONDrugDetailsForUpdation = await readState(ctx,drugCompositeKeyID);

      console.log("The shipment field for " + drugCompositeKeyID + " is " + JSONDrugDetailsForUpdation.shipment);
      console.log("The owner field for " + drugCompositeKeyID + " is " + JSONDrugDetailsForUpdation.owner);

      //Update the owner and shipping, Owner should be the composite key of buyer
      JSONDrugDetailsForUpdation.owner = generateBuyerCompanyIDForOwner;
      JSONDrugDetailsForUpdation.shipment = generatedShipmentCompositeKey;

      //Once you have updated the owner of the drug put the state back to the drug
      await writeState(ctx,drugCompositeKeyID, JSONDrugDetailsForUpdation);
      shimentObject.push(JSONDrugDetailsForUpdation);
  }
  
  return shimentObject;
}

  /**
   * retailDrug  -  Called by the retailer while selling the drug to a consumer.
   * @param ctx - The transaction Context object
   * @param drugName - Contains the name of the drug for which the PO is raised
   * @param serialNo - Serial number of the drug
   * @param buyerCRN - The Company Registration Number of Buyer
   * @param retailerCRN - The Company Registration Number of Retailer
   * @param customerAadhar - Aadhhar number of Cosnumer
   * @returns drugObject that's saved to the ledger or error in case of any validation failure   
   */
  async retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar) {
    //Validation1 - Should be invoked only by retailer, who is the owner of the drug
    //check retailerCRN is equal to the owner of the drug in drug object
    const drugCompositeKeyForSearch = await ctx.stub.createCompositeKey(keys.drugNameSpace(), [
      drugName,
      serialNo,
    ]);

    let drugRecord = await readState(ctx,drugCompositeKeyForSearch);

    //Find retailers composite key
    console.log("drugRecord.owner=> " + drugRecord.owner);
    console.log("retailerCRN=> " + retailerCRN);

    //Buyer compositeKey
    let retailerCompanyAttributes = await retrieveAllCompositeKeyAttributes(ctx,
      keys.companyNameSpace(),
      "retailerCRN",
      retailerCRN,
    );

    let returnedRetailerCompanyCRNForComparision = retailerCompanyAttributes[0];
    let returnedRetailerCompanyNameForComparision = retailerCompanyAttributes[1];

    console.log("returnedBuyerCompanyNameForOwner=> " + returnedRetailerCompanyNameForComparision);
    console.log("returnedRetailerCompanyCRNForComparision=> " + returnedRetailerCompanyCRNForComparision);

    let generateRetailerCompanyIDForOwner = await ctx.stub.createCompositeKey(
          keys.companyNameSpace(),
          [returnedRetailerCompanyCRNForComparision, returnedRetailerCompanyNameForComparision]
    );

    console.log("owner selling the drug => " + generateRetailerCompanyIDForOwner);
    console.log("owner from drug record => " + drugRecord.owner);
    if (!(drugRecord.owner === generateRetailerCompanyIDForOwner)){
       console.log("Sorry you are not the owner of this drug");
       throw new Error("Sorry you are not the owner of this drug");
    } 
    console.log("Yes he is the owner of the drug");
    //ownership of the drug is changed to the adhar number of the customer
    drugRecord.owner = customerAadhar;
    //Once you have updated the owner of the drug put the state back to the drug
    await writeState(ctx,drugCompositeKeyForSearch, drugRecord);
    return drugRecord;

  }

  /* ****** Part 3 - Transfer Drug Functions - Ends ***** */

  /* ****** Part 4 - View life cycle Functions - Starts ***** */
  /**
   * viewHistory  -  Used to view the lifecycle of the product by fetching trasactions from blockchain
   * @param ctx - The transaction Context object
   * @param drugName - Contains the name of the drug for which the PO is raised
   * @param serialNo - Serial number of the drug
   * @returns result - Transaction history of the drug   
   */
  async viewHistory(ctx, drugName, serialNo) {
    const productID = await ctx.stub.createCompositeKey(keys.drugNameSpace(), [drugName, serialNo]);

    let iterator = await ctx.stub.getHistoryForKey(productID);
    let result = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value) {
        const obj = JSON.parse(res.value.value.toString("utf8"));
        result.push(obj);
      }
      res = await iterator.next();
    }
    await iterator.close();
    return result;
  }

  /**
   * viewDrugCurrentState  -  Used to view the current state of the drug asset
   * @param ctx - The transaction Context object
   * @param drugName - Contains the name of the drug for which the PO is raised
   * @param serialNo - Serial number of the drug
   * @returns drugRecord - current state of the drug  
   */
  async viewDrugCurrentState(ctx, drugName, serialNo) {
    const productID = await ctx.stub.createCompositeKey(keys.drugNameSpace(), [drugName, serialNo]);
    let drugRecord = await readState(ctx,productID);
    return drugRecord;
  }


}
/* ****** Part 4 - View life cycle Functions - Ends ***** */

module.exports = PharmanetContract;
