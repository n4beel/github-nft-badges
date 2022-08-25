const createProvider = require("../");
// const Eth = require("ethjs");
const Web3 = require("web3");

const provider = createProvider();

renderText("Loading...");

if (provider) {
  console.log("provider detected", provider);
  const web3 = new Web3(provider);
  // const eth = new Eth(provider);
  renderText("MetaMask provider detected.");
  console.log("eth => ", web3.eth);
  web3.eth
    .getAccounts()
    .then((accounts) => {
      console.log("accounts -->", accounts);
      renderText(`Detected MetaMask account ${accounts[0]}`);
    })
    .catch((err) => {
      console.log(err);
    });

  provider.on("error", (error) => {
    if (error && error.includes("lost connection")) {
      renderText("MetaMask extension not detected.");
    }
  });
} else {
  renderText("MetaMask provider not detected.");
}

function renderText(text) {
  content.innerText = text;
}
