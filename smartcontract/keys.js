
function companyNameSpace(phone){
    return "org.drug-counterfeit.pharmanet.company";
}

function drugNameSpace(testId){
    return "org.drug-counterfeit.pharmanet.drug";
}

function poNameSpace(phone){
    return "org.drug-counterfeit.pharmanet.purchaseOrder";
}

function shipmentNameSpace(){
    return "org.drug-counterfeit.pharmanet.shipment"
}


module.exports = {
    companyNameSpace,
    drugNameSpace,
    poNameSpace,
    shipmentNameSpace
}