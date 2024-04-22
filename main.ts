import * as IERC20 from "@uniswap/v2-core/build/IERC20.json";
import * as IRouter from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import Web3 from "web3";
require("dotenv").config();
const account = process.env.ACCOUNT;
const usdtAddress = process.env.USDT_ADDRESS;
const wethAddress = process.env.WETH_ADDRESS;
const routerAddress = process.env.ROUTER_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;
const rpc = process.env.RPC;

const web3 = new Web3(rpc);
// const usdtContract = new web3.eth.Contract(IERC20.abi, usdtAddress);
const ethContract = new web3.eth.Contract(IERC20.abi, wethAddress);
const routerContract = new web3.eth.Contract(IRouter.abi, routerAddress);

async function INIT() {
  if (!account || !privateKey) throw new Error("Invalid account details!!!");
  if (!usdtAddress || !wethAddress)
    throw new Error("Token addresses required!!!");
  if (!routerAddress) throw new Error("Router address required!!!");
  if (!rpc) throw new Error("Rpc required!!!");

  const gasNeeded = 20000000;
  const deadline = Math.round(Date.now() / 1000) + 600 * 60;
  const wethAmountIn = web3.utils.toWei(0.01, "ether");
  const gasPrice = await web3.eth.getGasPrice();
  let nonce = await web3.eth.getTransactionCount(account, "pending");

  console.log("using nonce", nonce);
  const tx = {
    from: account,
    to: wethAddress,
    gas: gasNeeded,
    gasPrice,
    nonce,
    data: ethContract.methods.approve(routerAddress, wethAmountIn).encodeABI(),
  };

  nonce = nonce + BigInt(1);
  const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

  console.log("Approve Tx pending {1/2}");
  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

  console.log(`Approve Tx mined\n` + `Tx hash: ${receipt.transactionHash}\n`);

  const path = [wethAddress, usdtAddress];

  console.log("using nonce", nonce);
  const tx2 = {
    from: account,
    to: routerContract.options.address,
    gas: gasNeeded,
    gasPrice,
    nonce,
    data: routerContract.methods
      .swapExactTokensForTokensSupportingFeeOnTransferTokens(
        wethAmountIn,
        0,
        path,
        account,
        deadline
      )
      .encodeABI(),
  };

  const signedTx2 = await web3.eth.accounts.signTransaction(tx2, privateKey);

  console.log("Trade Tx pending {2/2}");
  const receipt2 = await web3.eth.sendSignedTransaction(
    signedTx2.rawTransaction
  );

  console.log(
    `Trade Tx mined, trade executed!\n` +
      `Tx hash: ${receipt2.transactionHash}\n`
  );
}

(async () => {
  try {
    await INIT();
  } catch (error: any) {
    console.log(error);
  } finally {
    console.log("done");
  }
})();
