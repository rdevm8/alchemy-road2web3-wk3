const { network, ethers } = require("hardhat")
const { assert } = require("chai")
const { developmentChains, networkConfig, contractConfig } = require("../../helper-hardhat-config")
const { getNamedSigners } = require("../../hardhat.config")

const { chainId, blockConfirmations } = network.config
const { name: contractName } = contractConfig

developmentChains.includes(network.name)
    ? describe.skip
    : describe(`${contractName} Unit Test`, function () {
          let mintFee,
              c_mintFee,
              maxSupply,
              c_maxSupply,
              myContract,
              transaction,
              transactionReceipt,
              c_withdrawalAddress,
              c_minted
          beforeEach(async () => {
              //DEPLOYER
              deployer = (await ethers.getNamedSigners()).deployer

              mintFee = networkConfig[chainId].mintFee
              maxSupply = networkConfig[chainId].maxSupply

              myContract = await ethers.getContract(contractName, deployer)

              c_mintFee = await myContract.getMintFee()
              c_maxSupply = await myContract.getMaxSupply()
              c_withdrawalAddress = await myContract.getWithdrawalAddress()
              c_minted = await myContract.getMinted()
          })

          describe("constructor", function () {
              it("Successfully sets constructor", async () => {
                  assert.equal(c_mintFee.toString(), mintFee)
                  assert.equal(c_maxSupply.toString(), maxSupply)
                  assert.equal(c_withdrawalAddress, deployer.address)
                  assert.equal(c_minted.toString(), "0")
              })
          })

          describe("mint", function () {
              it("Successfully mints an NFT", async () => {
                  transaction = await myContract.mint({ value: c_mintFee })
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  c_minted = await myContract.getMinted()
                  c_tokenLevel = await myContract.getTokenIdToLevels(c_minted)

                  assert.equal(c_minted.toString(), "1")
                  assert.equal(c_tokenLevel.toString(), "0")
              })
          })

          describe("train", function () {
              beforeEach(async () => {
                  transaction = await myContract.mint({ value: c_mintFee })
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  c_minted = await myContract.getMinted()
              })
              it("Successfully trains an NFT", async () => {
                  const c_prevTokenLevel = await myContract.getTokenIdToLevels(c_minted)

                  transaction = await myContract.train(c_minted)
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  c_tokenLevel = await myContract.getTokenIdToLevels(c_minted)

                  assert.equal(c_tokenLevel, c_prevTokenLevel.add(1).toString())
              })
          })

          describe("Withdraw", function () {
              it("Successfully withdraws", async () => {
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
