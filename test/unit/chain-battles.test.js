const { network, ethers, deployments } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains, networkConfig, contractConfig } = require("../../helper-hardhat-config")

const { chainId, blockConfirmations } = network.config
const { name: contractName } = contractConfig

!developmentChains.includes(network.name)
    ? describe.skip
    : describe(`${contractName} Unit Test`, function () {
          let mintFee,
              c_mintFee,
              maxSupply,
              c_maxSupply,
              accts,
              myContract,
              transaction,
              transactionReceipt,
              minters,
              c_withdrawalAddress,
              c_minted,
              acctContract,
              c_minted_newOwner,
              notExistTokenId

          beforeEach(async () => {
              accts = await ethers.getSigners()

              //DEPLOYER
              deployer = accts[0]

              mintFee = networkConfig[chainId].mintFee
              maxSupply = networkConfig[chainId].maxSupply

              await deployments.fixture(["all"])

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
              it("Succesfully emits MintedNFT event", async () => {
                  await expect(myContract.mint({ value: c_mintFee })).to.emit(
                      myContract,
                      "MintedNft"
                  )
              })
              it("Fails when below mint fee", async () => {
                  await expect(myContract.mint()).to.be.revertedWith(
                      "ChainBattles__NotEnoughETHSent"
                  )
              })
              it("Fails when exceeds max supply", async () => {
                  for (let ctr = 0; ctr < c_maxSupply; ctr++) {
                      acctContract = myContract.connect(accts[ctr])
                      transaction = await acctContract.mint({ value: c_mintFee })
                      transactionReceipt = await transaction.wait(blockConfirmations)
                  }

                  c_minted = await myContract.getMinted()

                  await expect(myContract.mint({ value: c_mintFee })).to.be.revertedWith(
                      "ChainBattles__MaxSupplyReached"
                  )

                  assert.equal(c_minted.toString(), c_maxSupply.toString())
              })
          })

          describe("train", function () {
              beforeEach(async () => {
                  transaction = await myContract.mint({ value: c_mintFee })
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  c_minted = await myContract.getMinted()

                  acctContract = myContract.connect(accts[1])
                  transaction = await acctContract.mint({ value: c_mintFee })
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  c_minted_newOwner = await myContract.getMinted()

                  notExistTokenId = c_minted_newOwner.add(1)
              })
              it("Successfully trains an NFT", async () => {
                  const c_prevTokenLevel = await myContract.getTokenIdToLevels(c_minted)

                  transaction = await myContract.train(c_minted)
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  c_tokenLevel = await myContract.getTokenIdToLevels(c_minted)

                  assert.equal(c_tokenLevel, c_prevTokenLevel.add(1).toString())
              })
              it("Succesfully emits TrainedNft event", async () => {
                  await expect(myContract.train(c_minted)).to.emit(myContract, "TrainedNft")
              })
              it("Fails when tokenId does not exist", async () => {
                  await expect(myContract.train(notExistTokenId)).to.be.revertedWith(
                      "ChainBattles__TokenIDNotExists"
                  )
              })
              it("Fails when is not owner/approved of NFT", async () => {
                  await expect(myContract.train(c_minted_newOwner)).to.be.revertedWith(
                      "ChainBattles__NotApprovedOrOwner"
                  )
              })
          })

          describe("Withdraw", function () {
              it("Successfully withdraws", async () => {
                  for (let ctr = 0; ctr < minters; ctr++) {
                      acctContract = myContract.connect(accts[ctr])
                      transaction = await acctContract.mint({ value: c_mintFee })
                      transactionReceipt = await transaction.wait(blockConfirmations)
                  }

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
              it("Fails when not owner", async () => {
                  const nonOwner = accts[1]

                  const nonOwnerContract = myContract.connect(nonOwner)

                  await expect(nonOwnerContract.withdraw()).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )
              })
          })

          describe("Change withdrawal address", function () {
              beforeEach(async () => {
                  for (let ctr = 0; ctr < minters; ctr++) {
                      acctContract = myContract.connect(accts[ctr])
                      transaction = await acctContract.mint({ value: c_mintFee })
                      transactionReceipt = await transaction.wait(blockConfirmations)
                  }
              })
              it("Successfully set withdrawal address and withdraws", async () => {
                  const newWithdrawalAddress = accts[1]
                  transaction = await myContract.setWithdrawalAddress(newWithdrawalAddress.address)
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  c_withdrawalAddress = await myContract.getWithdrawalAddress()

                  const prevBalanceNewWithdrawal = await myContract.provider.getBalance(
                      newWithdrawalAddress.address
                  )
                  const prevBalanceContract = await myContract.provider.getBalance(
                      myContract.address
                  )

                  transaction = await myContract.withdraw()
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  const currBalanceNewWithdrawal = await myContract.provider.getBalance(
                      newWithdrawalAddress.address
                  )
                  const currBalanceContract = await myContract.provider.getBalance(
                      myContract.address
                  )

                  assert.equal(c_withdrawalAddress.toString(), newWithdrawalAddress.address)
                  assert.equal(currBalanceContract.toString(), "0")
                  assert.equal(
                      currBalanceNewWithdrawal.toString(),
                      prevBalanceNewWithdrawal.add(prevBalanceContract).toString()
                  )
              })
          })
      })
