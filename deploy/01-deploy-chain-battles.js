const { network, ethers } = require("hardhat")
const { etherscan } = require("../hardhat.config")
const { networkConfig, developmentChains, contractConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const { chainId, blockConfirmations } = network.config
    const { name: contractName, token } = contractConfig
    const { name: tokenName, symbol: tokenSymbol } = token

    const mintFee = networkConfig[chainId].mintFee || 0
    const maxSupply = networkConfig[chainId].maxSupply || 0

    const verifyApiKey = etherscan.apiKey[network.name] || ""

    log("-----------------------------------")

    const args = [tokenName, tokenSymbol, mintFee, maxSupply]
    const contract = await deploy(contractName, {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && verifyApiKey.length > 0) {
        log(`Verifying ${contractName}...`)
        await verify(contract.address, args)
    }

    log("-----------------------------------")
}

module.exports.tags = ["all"]
