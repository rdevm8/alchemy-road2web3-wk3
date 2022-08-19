const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "rinkeby",
        mintFee: ethers.utils.parseEther("0.01"),
        minters: 5,
        maxSupply: 5,
    },
    5: {
        name: "goerli",
        mintFee: ethers.utils.parseEther("0.01"),
        minters: 5,
        maxSupply: 5,
    },
    80001: {
        name: "polygonMumbai",
        mintFee: ethers.utils.parseEther("0.01"),
        minters: 5,
        maxSupply: 5,
    },
    31337: {
        name: "hardhat",
        mintFee: ethers.utils.parseEther("0.01"),
        minters: 5,
        maxSupply: 5,
    },
}

const contractConfig = {
    name: "ChainBattles",
    token: {
        name: "Chain Battles",
        symbol: "CBTLS",
    },
    frontend: {
        addressesFileLoc: "../wk2-fe/buymeacoffee-app/constants/contractAddress.json",
        abiFileLoc: "../wk2-fe/buymeacoffee-app/constants/abi.json",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
    contractConfig,
}
