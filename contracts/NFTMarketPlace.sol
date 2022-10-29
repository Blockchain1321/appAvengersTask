
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

interface  ierc721{
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
    function safeMint(uint newTokenId,string memory tokenURI,address to) external;
    function changeOwner(address to) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function ownerOf(uint256 tokenId) external view returns (address owner);
     function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external  view  returns (address, uint256);
}


contract MyNFT is ERC721URIStorage, ERC2981, Ownable{

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _tokenIdCounter;
    uint mintingFee = 0.00025 ether;

    constructor() ERC721("MyNFT", "MTK") {
    }

    function supportsInterface(bytes4 interfaceId)public view virtual override(ERC721, ERC2981)returns (bool) {
      return super.supportsInterface(interfaceId);
    }

    /* Mint nft */
    function safeMintWithRoyality(address royaltyReceiver,string memory tokenURI,uint96 feeNumerator) public payable {
        require(msg.value == mintingFee, "You should pay the minting fee.");
         _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _setTokenRoyalty(newTokenId, royaltyReceiver, feeNumerator);
    }

    /* Updates the minting fee of the contract */
    function updateMintingFee(uint _mintingPrice) public  onlyOwner{
      mintingFee = _mintingPrice;
    }
    /* get the minting fee*/
    function _mintingTransactionFee() public view returns (uint) {
        return mintingFee; 
    }

}

contract NFTMarketplace {

    address payable owner;

    uint256 listingFee = 0.00025 ether;

    uint256 private totalListings;

    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;


    struct Listing {
        address owner;
        address NFTAddress;
        uint NFTId;
        uint demandedAmount;
        address soldTo;
    }

    mapping(uint => Listing) private listings;
    mapping(address => uint[]) private userListings;


    event mintToken(uint indexed tokenId);
    
    event Listed(
        address indexed by,
        address NFTAddress,
        uint indexed NFTId,
        uint indexed listingId,
        uint demandedAmount,
        uint at
    );

    event SoldViaListing(
        address indexed by,
        address indexed to,
        uint indexed NFTId,
        uint listingId,
        uint soldPrice,
        uint at
    );



    constructor(){
      owner = payable(msg.sender);
    }

    modifier onlyOwner{
      require(owner == msg.sender, "Only marketplace owner can update listing price.");
        _;
    }

    modifier isValidListingId(uint listingId) {
        require(
            listingId > 0 && listingId <= totalListings,
            "Invalid Listing Id"
        );
        _;
    }

    /* Updates the listing fee of the contract */
    function updateListingFee(uint _listingPrice) public  onlyOwner{
      listingFee = _listingPrice;
    }


    /* List Your NFT For Sell*/
    function listNFT(address _NFTAddress,uint _NFTId, uint _demandedAmount) public payable{
        require(msg.value == listingFee, "You should pay the listing fee.");
        address msgSender = msg.sender;
        require(ierc721(_NFTAddress).getApproved(_NFTId) == address(this),
        "You Did Not Approved Your NFT To This Contract");
        require(
            ierc721(_NFTAddress).ownerOf(_NFTId) == msgSender,
            "Only Owner Of This NFT Can List This NFT");
        ierc721(_NFTAddress).safeTransferFrom(msgSender, address(this), _NFTId);
        
        totalListings++;
        uint listingId = totalListings;
        listings[listingId] = Listing(
            msgSender,
            _NFTAddress,
            _NFTId,
            _demandedAmount,
            address(0)
        );
        userListings[msgSender].push(listingId);
        emit Listed(
            msgSender,
            _NFTAddress,
            _NFTId,
            listingId,
            _demandedAmount,
            block.timestamp
        );
    }
       
    /* Purchase Listed NFT */
    function buyListedNFT(uint listingId)
        public
        payable
        isValidListingId(listingId)
    {
        Listing memory listingData = listings[listingId];
        require(
            listingData.soldTo == address(0),
            "You Cannot Buy This NFT Because It Is Already Sold"
        );
        require(
            msg.value >= listingData.demandedAmount,
            "Send Value More Or Equal To Demanded Value"
        );
        
        address royalityreceiver;
        uint price;
        address nftAddress = listingData.NFTAddress;
        uint nftID = listingData.NFTId;
        uint amountToTransfer;
        bool success = checkRoyalties(nftAddress);
        if (success){
            (royalityreceiver,price) = ierc721(nftAddress).royaltyInfo(nftID,listingData.demandedAmount);
            payable(royalityreceiver).transfer(price);
            amountToTransfer = listingData.demandedAmount - price ;
            payable(listingData.owner).transfer(amountToTransfer);
        }
        else{
            amountToTransfer = listingData.demandedAmount;
            payable(listingData.owner).transfer(amountToTransfer);
        }
        address msgSender = msg.sender;
        listings[listingId].soldTo = msgSender;
        ierc721(nftAddress).safeTransferFrom(
            address(this),
            msgSender,
            listingData.NFTId
        );

        emit SoldViaListing(
            listingData.owner,
            msgSender,
            listingData.NFTId,
            listingId,
            amountToTransfer,
            block.timestamp
        );
    }

     /* Returns the total listings on platform */
    function _totalListings() public view returns (uint) {
        return totalListings;
    }

     /* Returns the user listings on platform */
    function _usersListings(address userAddress)
        public
        view
        returns (uint[] memory)
    {
        return userListings[userAddress];
    }

     /* Returns the listing data according to the listingID */
    function _listingData(uint listingId)
        public
        view
        isValidListingId(listingId)
        returns (Listing memory)
    {
        return listings[listingId];
    }

    /* Updates the listing price of the contract */
    function _listingTransactionFee() public view returns (uint) {
        return listingFee; 
    }

    /*  Allow marketplaces to check if the NFT supports the royalty standard  */
    function checkRoyalties(address _contract)  public view returns (bool) {
            (bool success) = IERC165(_contract).supportsInterface(_INTERFACE_ID_ERC2981);
            return success;
}

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure returns (bytes4){
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

}


pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyToken is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("MyToken", "MTK") {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }
}
