const { network, ethers, deployments } = require("hardhat")
const { assert, expect } = require("chai")
const {
    developmentChains,
    networkConfig,
    contractConfig,
    mockMemo,
} = require("../../helper-hardhat-config")

const { chainId, blockConfirmations } = network.config
const { name: contractName } = contractConfig
const { name: name, message: message } = mockMemo

developmentChains.includes(network.name)
    ? describe.skip
    : describe(`${contractName} Staging Test`, function () {
          let minTip,
              c_minTip,
              myContract,
              transaction,
              transactionReceipt,
              c_memos,
              memo,
              c_withdrawalAddress

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer

              minTip = networkConfig[chainId].minTip

              myContract = await ethers.getContract(contractName, deployer)

              c_minTip = await myContract.getMinTip()
              c_memos = await myContract.getMemos()
              c_withdrawalAddress = await myContract.getWithdrawalAddress()
          })

          describe("constructor", function () {
              it("Successfully sets constructor", async () => {
                  assert.equal(c_minTip.toString(), minTip)
                  assert.equal(c_withdrawalAddress.toString(), deployer)
              })
          })

          describe("buy coffee", function () {
              it("Successfully buys a coffee", async () => {
                  transaction = await myContract.buyCoffee(name, message, { value: c_minTip })
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  memo = (await myContract.getMemos())[0]

                  assert.equal(memo.from, deployer)
                  assert.equal(memo.name, name)
                  assert.equal(memo.message, message)
              })
          })

          describe("withdraw", function () {
              it("Successfully withdraws", async () => {
                  transaction = await myContract.buyCoffee(name, message, { value: c_minTip })
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  const prevBalanceDeployer = await deployer.getBalance()
                  const prevBalanceContract = await myContract.provider.getBalance(
                      myContract.address
                  )

                  transaction = await myContract.withdraw()
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const currBalanceDeployer = await deployer.getBalance()
                  const currBalanceContract = await myContract.provider.getBalance(
                      myContract.address
                  )

                  assert.equal(currBalanceContract.toString(), "0")
                  assert.equal(
                      currBalanceDeployer.add(gasCost).toString(),
                      prevBalanceDeployer.add(prevBalanceContract).toString()
                  )
              })
          })
      })
