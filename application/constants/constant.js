const config = require("../config/config")

function getIdentityPath(org){
    return config.path.identity + org
}

function getConnectionProfilePath(org){
    return config.path.connectionProfile + org + '.yaml'
}

function getCryptoMaterialsPath(){
    return config.path.cryptoMaterials
}

function getFabricUserName(org){
    return org.toUpperCase() + '_ADMIN'
}


module.exports = {
    getIdentityPath,
    getConnectionProfilePath,
    getCryptoMaterialsPath,
    getFabricUserName
}