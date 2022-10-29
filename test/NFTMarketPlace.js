const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("NFTMarketPlace", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function NPFixture() {
    const MNFT = await ethers.getContractFactory("MyNFT");
    const MyNFT = await MNFT.deploy();
    await MyNFT.deployed();
    

    const NFTMP= await ethers.getContractFactory("NFTMarketplace");
    const NFTMarketplace = await NFTMP.deploy();
    await NFTMarketplace.deployed();

    let myToken = await ethers.getContractFactory("MyToken");
    myToken  = await myToken .deploy();
    await myToken .deployed();

    let mintFee = await MyNFT._mintingTransactionFee();
    mintFee = mintFee.toString();

    let listingFee = await NFTMarketplace._listingTransactionFee();
    listingFee = listingFee.toString();
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount,otherAccount1] = await ethers.getSigners();

    return { MyNFT, NFTMarketplace, owner, mintFee, listingFee,otherAccount,otherAccount1,myToken };
  }

  describe("MintNFT", function () {
    it("Should able to mint  and also shows in his account", async function () {
      const { MyNFT,otherAccount, mintFee} = await loadFixture(NPFixture);
      await MyNFT.connect(otherAccount).safeMintWithRoyality(otherAccount.address,'https://pixabay.com/images/search/nature/',"10",{value:mintFee});
      expect(await MyNFT.ownerOf("1")).to.equal(otherAccount.address);
      let balance = await MyNFT.balanceOf(otherAccount.address);
      balance = balance.toString();
      expect (await MyNFT.balanceOf(otherAccount.address)).to.equal("1");

    });

    it("Should fail if minitng fee is not provided", async function () {
      const { MyNFT,otherAccount} = await loadFixture(NPFixture);
      await expect(MyNFT.connect(otherAccount).safeMintWithRoyality(otherAccount.address,'https://pixabay.com/images/search/nature/',"10")).to.be.revertedWith(
                "You should pay the minting fee."
              );
    });
  });

  describe("listNFT", function () {
      it("Should revert with the right error if listing fee is not given while listing NFT,not approved to this contract and lister is not owner", async function () {
        const { MyNFT, NFTMarketplace,otherAccount ,mintFee,listingFee} = await loadFixture(NPFixture);
        let transaction = await MyNFT.connect(otherAccount).safeMintWithRoyality(otherAccount.address,'https://pixabay.com/images/search/nature/',"10",{value:mintFee}); 
        transaction = await transaction.wait();
        let nftID = transaction.events[0].args[2];
        console.log(nftID);
        await expect(NFTMarketplace.connect(otherAccount).listNFT(MyNFT.address,"1","1000000000000000000")).to.be.revertedWith(
          "You should pay the listing fee."
        );
        await expect(NFTMarketplace.connect(otherAccount).listNFT(MyNFT.address,"1","1000000000000000000",{value:listingFee})).to.be.revertedWith(
          "You Did Not Approved Your NFT To This Contract"
        );
        await MyNFT.connect(otherAccount).approve(NFTMarketplace.address,"1");
        await expect(NFTMarketplace.listNFT(MyNFT.address,"1","1000000000000000000",{value:listingFee})).to.be.revertedWith(
          "Only Owner Of This NFT Can List This NFT");
      });

      it("Should transfer NFT to NFTmarkeplace address after listing the NFT  ", async function () {
        const { MyNFT, NFTMarketplace,otherAccount ,mintFee,listingFee} = await loadFixture(NPFixture);
        await MyNFT.connect(otherAccount).safeMintWithRoyality(otherAccount.address,'https://pixabay.com/images/search/nature/',"10",{value:mintFee}); 
        await MyNFT.connect(otherAccount).approve(NFTMarketplace.address,"1");
        await NFTMarketplace.connect(otherAccount).listNFT(MyNFT.address,"1","1000000000000000000",{value:listingFee});
        expect(await MyNFT.ownerOf("1")).to.equal(NFTMarketplace.address);
      });
    });

    describe("BuyNFT", function () {
      it("Should revert with the right error if NFT already sold,and if not send the demanded value", async function () {
        const { MyNFT, NFTMarketplace,listingFee,mintFee,otherAccount,otherAccount1} = await loadFixture(NPFixture);
        await MyNFT.connect(otherAccount).safeMintWithRoyality(otherAccount.address,'https://pixabay.com/images/search/nature/',"10",{value:mintFee});      
        await MyNFT.connect(otherAccount).approve(NFTMarketplace.address,"1");
        let transaction = await NFTMarketplace.connect(otherAccount).listNFT(MyNFT.address,"1","1000000000000000000",{value:listingFee});
        transaction = await transaction.wait();
        let listingID =transaction.events[2].args[3];
        let demandedAmount = transaction.events[2].args[4];
        await expect(NFTMarketplace.buyListedNFT(listingID)).to.be.revertedWith("Send Value More Or Equal To Demanded Value");
        await (NFTMarketplace.buyListedNFT(listingID,{value:demandedAmount}));
        await expect(NFTMarketplace.connect(otherAccount1).buyListedNFT(listingID,{value:demandedAmount})).to.be.revertedWith("You Cannot Buy This NFT Because It Is Already Sold");
      });

      it("Nft should transfer to buyer account", async function () {
        const { MyNFT, NFTMarketplace,owner,listingFee,mintFee,otherAccount} = await loadFixture(NPFixture);
        await MyNFT.connect(otherAccount).safeMintWithRoyality(otherAccount.address,'https://pixabay.com/images/search/nature/',"10",{value:mintFee});
        await MyNFT.connect(otherAccount).approve(NFTMarketplace.address,"1");
        let transaction = await (NFTMarketplace.connect(otherAccount).listNFT(MyNFT.address,"1","1000000000000000000",{value:listingFee}));
        transaction = await transaction.wait();
        let listingID =transaction.events[2].args[3];
        let demandedAmount = transaction.events[2].args[4];
        await (NFTMarketplace.buyListedNFT(listingID,{value:demandedAmount}));
        expect(await MyNFT.ownerOf("1")).to.equal(owner.address);
      });

      it("should transfer amount minus royality fee in the case of NFT with royality", async function () {
        const { MyNFT, NFTMarketplace,listingFee,mintFee,otherAccount} = await loadFixture(NPFixture);
        await MyNFT.connect(otherAccount).safeMintWithRoyality(otherAccount.address,'https://pixabay.com/images/search/nature/',"10",{value:mintFee});
        await MyNFT.connect(otherAccount).approve(NFTMarketplace.address,"1");
        let transaction = await (NFTMarketplace.connect(otherAccount).listNFT(MyNFT.address,"1","1000000000000000000",{value:listingFee}));
        transaction = await transaction.wait();
        let lID =transaction.events[2].args[3];
        let demandedAmount = transaction.events[2].args[4];
        let valueTransfered = await (NFTMarketplace.buyListedNFT(lID,{value:demandedAmount}));
        valueTransfered = await valueTransfered.wait();
        valueTransfered = valueTransfered.events[2].args[4];
        // console.log(valueTransfered);
        expect(valueTransfered).to.equal("999000000000000000");
      });

      it("should transfer whole amount in the case of NFT without royality", async function () {
        const {myToken, MyNFT, NFTMarketplace,owner,listingFee,mintFee,otherAccount,otherAccount1} = await loadFixture(NPFixture);
        await myToken.safeMint(owner.address);
        // await myToken.ownerOf("0");
        // console.log(await myToken.ownerOf("0"),owner.address);
        await myToken.approve(NFTMarketplace.address,"0");
        let transaction = await (NFTMarketplace.listNFT(myToken.address,"0","1000000000000000000",{value:listingFee}));
        transaction = await transaction.wait();
        let lID =transaction.events[2].args[3];
        let demandedAmount = transaction.events[2].args[4];
        let valueTransfered = await (NFTMarketplace.buyListedNFT(lID,{value:demandedAmount}));
        valueTransfered = await valueTransfered.wait();
        valueTransfered = valueTransfered.events[2].args[4];
        // console.log(valueTransfered);
        expect(valueTransfered).to.equal("1000000000000000000");
      });
    });
});
