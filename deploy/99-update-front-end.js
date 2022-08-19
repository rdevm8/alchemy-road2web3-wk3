const { ethers, network } = require("hardhat")
const fs = require("fs")
const { json } = require("hardhat/internal/core/params/argumentTypes")
const { contractConfig } = require("../helper-hardhat-config")

const FRONT_END_ADDRESSES = "../wk2-fe/buymeacoffee-app/constants/contractAddress.json"
const FRONT_END_ABI = "../wk2-fe/buymeacoffee-app/constants/abi.json"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END == "true") {
        console.log("Updating front end...")

        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateAbi() {
    const myContract = await ethers.getContract(contractConfig.name)

    writeFileSync(FRONT_END_ABI, myContract.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
    const myContract = await ethers.getContract(contractConfig.name)

    const chainId = network.config.chainId.toString()
    const currentAddresses = JSON.parse(readFileSync(FRONT_END_ADDRESSES, "utf8"))

    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(myContract.address)) {
            currentAddresses[chainId].push(myContract.address)
        }
    } else {
        currentAddresses[chainId] = [myContract.address]
    }

    writeFileSync(FRONT_END_ADDRESSES, JSON.stringify(currentAddresses))
}

module.exports.tags = ["frontend"]
