require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-waffle");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks:{
    Goerli: {
      url:"https://eth-goerli.g.alchemy.com/v2/fL6IeeePHVlBgEp9c43Ttsp5quWc1Tt9",
      accounts:["2325e60227766712c6aa45a0f25ab9654aa4f4828f0aedf71e2b4e7b4da39947",],
    }, 
    Polygon: {
      url:"https://polygon-mumbai.g.alchemy.com/v2/amRBmY-dBEuDeT86nV24lPXLJz_X_EQQ",
      accounts:["ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",],
    }, 

  },
  etherscan:{
    apiKey:"6VF3TQNBEZGK583ARTG53DUWJAPY81WBZY",
    // "R4BYANR5MYW6VZUYZ265I2NKT3GZID2CKT"
  },
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
};
