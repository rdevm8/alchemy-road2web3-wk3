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

!developmentChains.includes(network.name)
    ? describe.skip
    : describe(`${contractName} Unit Test`, function () {
          let minTip,
              c_minTip,
              accts,
              myContract,
              transaction,
              transactionReceipt,
              c_memos,
              memo,
              tippers,
              c_withdrawalAddress

          beforeEach(async () => {
              deployer = (await ethers.getSigners())[0]
              accts = await ethers.getSigners()

              minTip = networkConfig[chainId].minTip
              tippers = networkConfig[chainId].tippers

              await deployments.fixture(["all"])

              myContract = await ethers.getContract(contractName, deployer)

              c_minTip = await myContract.getMinTip()
              c_memos = await myContract.getMemos()
              c_withdrawalAddress = await myContract.getWithdrawalAddress()
          })

          describe("constructor", function () {
              it("Successfully sets constructor", async () => {
                  assert.equal(c_minTip.toString(), minTip)
                  assert.equal(c_memos.toString(), [])
                  assert.equal(c_withdrawalAddress, deployer.address)
              })
          })

          describe("buy coffee", function () {
              it("Successfully buys a coffee", async () => {
                  transaction = await myContract.buyCoffee(name, message, { value: c_minTip })
                  transactionReceipt = await transaction.wait(blockConfirmations)

                  memo = (await myContract.getMemos())[0]

                  assert.equal(memo.from, deployer.address)
                  assert.equal(memo.name, name)
                  assert.equal(memo.message, message)
              })
              it("Succesfully emits event", async () => {
                  await expect(myContract.buyCoffee(name, message, { value: c_minTip })).to.emit(
                      myContract,
                      "NewMemo"
                  )
              })
              it("Fails when below minimum tip", async () => {
                  await expect(myContract.buyCoffee(name, message)).to.be.revertedWith(
                      "BuyMeACoffee__DidNotTipEnough"
                  )
              })
          })

          describe("withdraw", function () {
              it("Successfully withdraws", async () => {
                  for (let ctr = 0; ctr < tippers; ctr++) {
                      acctContract = myContract.connect(accts[ctr])
                      transaction = await acctContract.buyCoffee(name, message, { value: c_minTip })
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
                  for (let ctr = 0; ctr < tippers; ctr++) {
                      acctContract = myContract.connect(accts[ctr])
                      transaction = await acctContract.buyCoffee(name, message, { value: c_minTip })
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
