"use strict";

/**
 * This is a Node.JS module to load a user's Identity to his wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: MANUFACTURER_ADMIN/DISTRIBUTOR_ADMIN/TRANSPORTER_ADMIN/RETAILER_ADMIN/CONSUMER_ADMIN
 *  User Organization: MANUFACTURER/DISTRIBUTOR/TRANSPORTER/RETAILER/CONSUMER
 *  User Role: Admin
 *
 */

const fs = require("fs"); // FileSystem Library
const { FileSystemWallet, X509WalletMixin } = require("fabric-network"); // Wallet Library provided by Fabric

const {getIdentityPath, getCryptoMaterialsPath} = require("../constants/constant");

//Common function to create and import the identity using provided certificate & key
async function createIdentity(identityPath,identitylabel,mspId,certificatePath, privateKeyPath) {
    // Directory where all Network artifacts are stored
    const crypto_materials = getCryptoMaterialsPath();
    // A wallet is a filesystem path that stores a collection of Identities
    const wallet = new FileSystemWallet(identityPath);

    // Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
    const certificate = fs.readFileSync(certificatePath).toString();
    // IMPORTANT: Change the private key name to the key generated on your computer
    const privatekey = fs.readFileSync(privateKeyPath).toString();

    const identity = X509WalletMixin.createIdentity(mspId, certificate, privatekey);

    await wallet.import(identitylabel, identity);
}

/**
 * This used to load a manufacturer org Identity to its wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: MANUFACTURER_ADMIN
 *  User Organization: MANUFACTURER              
 *  User Role: Admin
 *
 */       
async function addToWalletManufacturer(req,res) {
  // Main try/catch block
  try {
    
    //Read certificatepath and privatekey path from request payload
    const certificatePath = req.body.certificatePath;
    const privateKeyPath = req.body.privateKeyPath;

    // Load credentials into wallet
    const identityPath = getIdentityPath("manufacturer");
    const identityLabel = "MANUFACTURER_ADMIN";
    const mspId = "manufacturerMSP";

    await createIdentity(identityPath,identityLabel,mspId,certificatePath, privateKeyPath);
    console.log('Manufacturer credentials successfully added to wallet');
    const result = {
        status: 'success',
        message: 'Manufacturer credentials successfully added to wallet'
    };
    return res.json(result);
  } catch (error) {
    console.log(`Error adding to Manufacturer wallet. ${error}`);
    console.log(error.stack);
    
    const result = {
        status: 'error',
        message: 'Failed',
        error: error
    };
    return res.status(500).send(result);
  }
}

/**
 * This used to load a distributor org Identity to its wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: DISTRIBUTOR_ADMIN
 *  User Organization: DISTRIBUTOR              
 *  User Role: Admin
 *
 */       
async function addToWalletDistributor(req, res) {
    // Main try/catch block
    try {

      //Read certificatepath and privatekey path from request payload
      const certificatePath = req.body.certificatePath;
      const privateKeyPath = req.body.privateKeyPath;

      // Load credentials into wallet
      const identityPath = getIdentityPath("distributor");
      const identityLabel = "DISTRIBUTOR_ADMIN";
      const mspId = "distributorMSP";
  
      await createIdentity(identityPath,identityLabel,mspId,certificatePath, privateKeyPath);
      console.log('Distributor credentials successfully added to wallet');
      const result = {
          status: 'success',
          message: 'Distributor credentials successfully added to wallet'
      };
      return res.json(result);
    
    } catch (error) {
      console.log(`Error adding to Distributor wallet. ${error}`);
      console.log(error.stack);

      const result = {
        status: 'error',
        message: 'Failed',
        error: error
    };
    return res.status(500).send(result);
    }
  }

/**
 * This used to load a transporter org Identity to its wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: TRANSPORTER_ADMIN
 *  User Organization: TRANSPORTER              
 *  User Role: Admin
 *
 */       
async function addToWalletTransporter(req,res) {
    // Main try/catch block
    try {
      //Read certificatepath and privatekey path from request payload
      const certificatePath = req.body.certificatePath;
      const privateKeyPath = req.body.privateKeyPath;
      
      // Load credentials into wallet
      const identityPath = getIdentityPath("transporter");
      const identityLabel = "TRANSPORTER_ADMIN";
      const mspId = "transporterMSP";
  
      await createIdentity(identityPath,identityLabel,mspId,certificatePath, privateKeyPath);
      console.log('Transporter credentials successfully added to wallet');
      const result = {
          status: 'success',
          message: 'Transporter credentials successfully added to wallet'
      };
      return res.json(result);
  
    } catch (error) {
      console.log(`Error adding to transporter wallet. ${error}`);
      console.log(error.stack);
      const result = {
        status: 'error',
        message: 'Failed',
        error: error
      };
      return res.status(500).send(result);
    }
}

/**
 * This used to load a Retailer org Identity to its wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: RETAILER_ADMIN
 *  User Organization: RETAILER              
 *  User Role: Admin
 *
 */       
async function addToWalletRetailer(req, res) {
    // Main try/catch block
    try {
      //Read certificatepath and privatekey path from request payload
      const certificatePath = req.body.certificatePath;
      const privateKeyPath = req.body.privateKeyPath;
        
      // Load credentials into wallet
      const identityPath = getIdentityPath("retailer");
      const identityLabel = "RETAILER_ADMIN";
      const mspId = "retailerMSP";
  
      await createIdentity(identityPath,identityLabel,mspId,certificatePath, privateKeyPath);

      console.log('Retailer credentials successfully added to wallet');
      const result = {
          status: 'success',
          message: 'Retailer credentials successfully added to wallet'
      };
      return res.json(result);
  
    } catch (error) {
      console.log(`Error adding to Retailer wallet. ${error}`);
      console.log(error.stack);
      const result = {
        status: 'error',
        message: 'Failed',
        error: error
      };
      return res.status(500).send(result);
    }
}

/**
 * This used to load a Consumer org Identity to its wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: CONSUMER_ADMIN
 *  User Organization: CONSUMER              
 *  User Role: Admin
 *
 */       
async function addToWalletConsumer(req, res) {
    // Main try/catch block
    try {
      //Read certificatepath and privatekey path from request payload
      const certificatePath = req.body.certificatePath;
      const privateKeyPath = req.body.privateKeyPath;
  
      // Load credentials into wallet
      const identityPath = getIdentityPath("consumer");
      const identityLabel = "CONSUMER_ADMIN";
      const mspId = "consumerMSP";
  
      await createIdentity(identityPath,identityLabel,mspId,certificatePath, privateKeyPath);
      console.log('Consumer credentials successfully added to wallet');
      const result = {
          status: 'success',
          message: 'Consumer credentials successfully added to wallet'
      };
      return res.json(result);
  
    } catch (error) {
      console.log(`Error adding to Consumer wallet. ${error}`);
      console.log(error.stack);
      const result = {
        status: 'error',
        message: 'Failed',
        error: error
      };
      return res.status(500).send(result);
   }
}

module.exports = {
    addToWalletManufacturer,
    addToWalletDistributor,
    addToWalletTransporter,
    addToWalletRetailer,
    addToWalletConsumer
}