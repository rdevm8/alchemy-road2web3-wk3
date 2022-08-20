require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const POLYMUMBAI_RPC_URL = process.env.POLYMUMBAI_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY
const USE_GAS_REPORT = process.env.USE_GAS_REPORT
const GAS_REPORT_TOKEN = process.env.GAS_REPORT_TOKEN ? process.env.GAS_REPORT_TOKEN : "ETH"

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
            // forking: {
            //     url: MAINNET_RPC_URL,
            // },
        },
        rinkeby: {
            chainId: 4,
            blockConfirmations: 6,
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
        goerli: {
            chainId: 5,
            blockConfirmations: 6,
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
        polygonMumbai: {
            chainId: 80001,
            blockConfirmations: 6,
            url: POLYMUMBAI_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
        localhost: {
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: {
            mainnet: "",
            rinkeby: ETHERSCAN_API_KEY,
            goerli: ETHERSCAN_API_KEY,
            polygon: "",
            polygonMumbai: POLYGONSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: USE_GAS_REPORT,
        currency: "USD",
        outputFile: "reports/gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: GAS_REPORT_TOKEN,
    },
    solidity: {
        compilers: [{ version: "0.8.7" }],
    },
    namedAccounts: {
        deployer: {
            default: 0,
            4: "0x0fdB63105291aB806c09274FA8Df08F58A07d811",
            5: "0x0fdB63105291aB806c09274FA8Df08F58A07d811",
            80001: "0x0fdB63105291aB806c09274FA8Df08F58A07d811",
        },
    },
    mocha: {
        timeout: 5000000, //ms -> 200 seconds
    },
}
