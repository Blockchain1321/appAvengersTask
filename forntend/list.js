const NFTMarketplace = require ('../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json');
const MyNFT = require ('../artifacts/contracts/NFTMarketplace.sol/MyNFT.json');
const { ethers } = require("hardhat");

const nftAddres = "0x459EbE9Ee658745729e2DB3f30CC971947592FfE";
const NFTmarketplaceAddress = "0x3F4b2d60EBf4beFE8D3B680c37F5e5f4423148a7";
const provider = new ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/amRBmY-dBEuDeT86nV24lPXLJz_X_EQQ`);
const nft = new ethers.Contract(nftAddres, MyNFT.abi, provider);
const NFTmarketplace = new ethers.Contract(NFTmarketplaceAddress, NFTMarketplace.abi,provider);

account  = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
account1 = "0xB18F96a47Cc271410158d8F6aFfCEae0ee3bA9ca";
const privateKey = "2325e60227766712c6aa45a0f25ab9654aa4f4828f0aedf71e2b4e7b4da39947";
const privateKey1 ="845e7b96f229012bfb9cf89a0da0c8bc9cb0e058c46a9b39d3b2be0929fcacf3"
const wallet = new ethers.Wallet(privateKey, provider);
const wallet2 = new ethers.Wallet(privateKey1, provider);
const nftWithWallet = nft.connect(wallet)
const NFTmarketplaceWithWallet= NFTmarketplace.connect(wallet);

// list NFT
const ListNFT= async(_nftaddress,_NFTId,_demandedAmount) => {
    let listfee = await NFTmarketplace._listingTransactionFee()
    await nftWithWallet.approve(NFTmarketplaceAddress,_NFTId);
    let g = await NFTmarketplaceWithWallet.listNFT(_nftaddress,_NFTId,_demandedAmount,{value:listfee});
    gwait = await g.wait();
    let listingID = gwait.events[3].args[3]
    console.log(listingID);
}
ListNFT("0x459EbE9Ee658745729e2DB3f30CC971947592FfE","19","10000")