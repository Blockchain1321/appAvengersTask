// API Key: 041f162a2f1e1c923aee
// API Secret: baf9f91cbf5a7f5f0b56529796447192493ea5dd87102587ecec4ee3f5bc827b
// JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxZWZjZjVjMC0zZTZlLTRiNDYtOGNmZi1jMzIzOTJhNmUyNjIiLCJlbWFpbCI6ImJoYXJhdG5pdGluMTJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjA0MWYxNjJhMmYxZTFjOTIzYWVlIiwic2NvcGVkS2V5U2VjcmV0IjoiYmFmOWY5MWNiZjVhN2Y1ZjBiNTY1Mjk3OTY0NDcxOTI0OTNlYTVkZDg3MTAyNTg3ZWNlYzRlZTNmNWJjODI3YiIsImlhdCI6MTY2Njg4OTA3Mn0.rIMJDeY2YRvRfduLFTW2AEwH3LqXZ2ObkQ_OKi6gdns
//
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const NFTMarketplace = require ('../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json');
const MyNFT = require ('../artifacts/contracts/NFTMarketplace.sol/MyNFT.json');
const { ethers } = require("hardhat");
const { log } = require('console');
const providers = require('ethers').providers;

const nftAddres = "0x459EbE9Ee658745729e2DB3f30CC971947592FfE";
const NFTmarketplaceAddress = "0x3F4b2d60EBf4beFE8D3B680c37F5e5f4423148a7";
const provider = new ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/amRBmY-dBEuDeT86nV24lPXLJz_X_EQQ`);
const nft = new ethers.Contract(nftAddres, MyNFT.abi, provider);
const NFTmarketplace = new ethers.Contract(NFTmarketplaceAddress, NFTMarketplace.abi,provider);


account  = "0xB18F96a47Cc271410158d8F6aFfCEae0ee3bA9ca";
account1 = "0xe1DE250BB40BfEA3aBa4b22B1F36087754321F56";
const privateKey = "2325e60227766712c6aa45a0f25ab9654aa4f4828f0aedf71e2b4e7b4da39947";
const privateKey1 ="845e7b96f229012bfb9cf89a0da0c8bc9cb0e058c46a9b39d3b2be0929fcacf3"
const wallet = new ethers.Wallet(privateKey, provider);
const wallet2 = new ethers.Wallet(privateKey1, provider);
const nftWithWallet = nft.connect(wallet)

const API_Key = "041f162a2f1e1c923aee";
const API_Secret = "baf9f91cbf5a7f5f0b56529796447192493ea5dd87102587ecec4ee3f5bc827b";
const pinata = pinataSDK(API_Key,API_Secret);


const options = {
    pinataMetadata: {
        name: 'imagejson',
        keyvalues: {
            customKey: 'customValue',
            customKey2: 'customValue2'
        }
    },
    pinataOptions: {
        cidVersion: 0
    }
};
// storing the image on the ipfs
const pinFileToIPFS = () =>{
    const readableStreamForFile = fs.createReadStream('./images/Screenshot_20200930-135517_WhatsApp.jpg');
    return pinata.pinFileToIPFS(readableStreamForFile).then((result) => {
            return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
        }).catch((err) => {
            console.log(err);
    });
}

// storing the image metadata on ipfs
const pinJSONToIPFS = (body) => {
    return pinata.pinJSONToIPFS(body,options).then((result) => {
        //handle results here
        return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    }).catch((err) => {
        //handle error here
        console.log(err);
    });
}

// storing the data and return URI
const getMetadata = async () => {
    const imageUrl = await pinFileToIPFS();
    // console.log(imageUrl);
    const body = {
        name:"Radha raman",
        description:"hare krishna hare krishna k k hare hare",
        image:imageUrl
    };
    const metadata = await pinJSONToIPFS(body);
    return metadata;
}

// Mint NFT
const CreatNFT= async() => {
    let nftfee = await nft._mintingTransactionFee()
    let uri = await getMetadata();
    let g =await nftWithWallet.safeMintWithRoyality(account,uri,"10",{value:nftfee});
    let gwait = await g.wait();
    let NFTID = await gwait.events[1].args[2];
    console.log(NFTID,nftAddres);
}
CreatNFT()
