// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Internal imports for NFT OpenZipline
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarketplace
 * @notice Decentralized marketplace for buying, selling, and trading NFTs
 */
contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard, Ownable {
    uint256 private _TokenIdCounter;

    // fees
    uint16 feePercent = 1;
    uint256 minFee = 0.00025 ether;
    uint256 listingFee = 0.0025 ether;
    
    // stats
    uint256 private _itemsSold;
    uint256 private _itemsListed;

    // Tracking
    mapping(uint256 => Listing) private listings; // token id => Listing

    enum ListingStatus {
        None,
        ForSale,
        Sold
    }

    struct Listing {
        address payable seller;
        uint256 price;
        ListingStatus status;
        uint256 tokenId;
    }

    event NewListing(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event Delisted(
        uint256 indexed tokenId,
        address indexed seller
    );

    event Sold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    constructor() ERC721("NFT Marketplace", "NFT") Ownable(msg.sender) {}

    /**
     * @notice Mint new NFT and list it for sale
     * @param tokenURI Metadata URI (IPFS/HTTP)
     * @param price Sale price in Wei (must be > minFee)
     * @return newTokenId ID of newly minted token
     */
    function createToken(string memory tokenURI, uint256 price)
        external
        payable
        nonReentrant
        returns (uint256)
    {
        require(price > minFee, "Price is too low");
        require(msg.value == listingFee, "You must pay the listing price.");

        uint256 newTokenId = _TokenIdCounter;
        _TokenIdCounter++;

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);


        _listToken(newTokenId, price);
        return newTokenId;
    }

    /**
     * @notice List an existing NFT you own
     * @param tokenId Token ID to list
     * @param price Sale price in Wei (must be > minFee)
     */
    function listToken(uint256 tokenId, uint256 price)
        external
        payable
        nonReentrant
    {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "You are not the owner of this token");
        require(price > minFee, "Price is too low");
        require(msg.value == listingFee, "You must pay the listing price.");

        _listToken(tokenId, price);
    }


    function _listToken(uint256 tokenId, uint256 price) 
        internal
    {

        require(listings[tokenId].status != ListingStatus.ForSale, "Token is already listed");

        listings[tokenId].price = price;
        listings[tokenId].seller = payable(msg.sender);
        listings[tokenId].status = ListingStatus.ForSale;
        listings[tokenId].tokenId = tokenId; // Necessary if the listing is new

        _transfer(msg.sender, address(this), tokenId);
        _itemsListed++;

        emit NewListing(tokenId, msg.sender, price);
    }

    /**
     * @notice Cancel listing and return NFT to seller
     * @param tokenId Token ID to delist
     */
    function delistToken(uint256 tokenId)
        external
        nonReentrant
    {
        require(_exists(tokenId), "Token does not exist");
        require(listings[tokenId].seller == msg.sender, "You are not the owner of this token");

        address seller = listings[tokenId].seller;

        listings[tokenId].status = ListingStatus.None;
        listings[tokenId].seller = payable(address(0));
        listings[tokenId].price = 0;

        _transfer(address(this), seller, tokenId);

        emit Delisted(tokenId, seller);
    }

    /**
     * @notice Buy a listed NFT
     * @dev Fee = max(price * feePercent / 100, minFee). Fee stays in contract.
     * @param tokenId Token ID to purchase
     */
    function buyToken(uint256 tokenId)
        external
        payable
        nonReentrant
    {
        Listing storage listing = listings[tokenId];

        require(listing.status == ListingStatus.ForSale, "Token is not for sale");
        require(msg.value == listing.price, "Insufficient funds");

        uint256 fee;
        if ((feePercent * listing.price) / 100 < minFee) {
            fee = minFee;
        } else {
            fee = (feePercent * listing.price) / 100;
        }

        uint256 sell_amount = listing.price - fee;

        address seller = listing.seller;
        listing.status = ListingStatus.Sold;
        listing.seller = payable(address(0));
        listing.price = 0;

        _transfer(address(this), msg.sender, tokenId);
        (bool success,) = payable(seller).call{value: sell_amount}("");
        require(success, "Transfer failed");

        _itemsSold++;

        emit Sold(tokenId, listing.seller, msg.sender, listing.price - fee);
    }

    /**
     * @notice Get active listings (paginated)
     * @param page Page number (0-indexed)
     * @param pageSize Items per page
     * @return Active listings for this page
     */
    function getActiveListings(uint256 page, uint256 pageSize)
        public
        view
        returns (Listing[] memory)
    {
        uint256 activeCount = 0;
        uint256 maxCount = (page + 1) * pageSize >= _TokenIdCounter ? _TokenIdCounter : (page + 1) * pageSize;
        for (uint256 i = page * pageSize; i < maxCount; i++) {
            if (listings[i].status == ListingStatus.ForSale) {
                activeCount++;
            }
        }

        Listing[] memory result = new Listing[](activeCount);
        uint256 resultIndex = 0;
        for (uint256 i = page * pageSize; i < maxCount; i++) {
            if (listings[i].status == ListingStatus.ForSale) {
                result[resultIndex] = listings[i];
                resultIndex++;
            }
        }
        return result;
    }

    /**
     * @notice Get your active listings (paginated)
     * @param page Page number (0-indexed)
     * @param pageSize Items per page
     * @return Your active listings for this page
     */
    function getMyListings(uint256 page, uint256 pageSize)
        public
        view
        returns (Listing[] memory)
    {

        uint256 activeCount = 0;
        uint256 maxCount = (page + 1) * pageSize >= _TokenIdCounter ? _TokenIdCounter : (page + 1) * pageSize;
        for (uint256 i = page * pageSize; i < maxCount; i++) {
            if (listings[i].status == ListingStatus.ForSale && listings[i].seller == msg.sender) {
                activeCount++;
            }
        }

        Listing[] memory result = new Listing[](activeCount);
        uint256 resultIndex = 0;
        for (uint256 i = page * pageSize; i < maxCount; i++) {
            if (listings[i].status == ListingStatus.ForSale && listings[i].seller == msg.sender) {
                result[resultIndex] = listings[i];
                resultIndex++;
            }
        }
        return result;
    }

    /**
     * @notice Get listing details
     * @param id Token ID
     * @return Listing struct
     */
    function getListing(uint256 id) public view returns (Listing memory) {
        return listings[id];
    }

    /**
     * @notice Get marketplace stats
     * @return itemsSold Total sales count
     * @return itemsListed Current active listings count
     */
    function getStats() public view returns (uint256, uint256) {
        return (_itemsSold, _itemsListed);
    }

    ////////////////////////////////////////////////
    // Admin functions
    ////////////////////////////////////////////////


    /**
     * @notice Withdraw accumulated fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require (balance > 0, "No balance to withdraw");

        (bool success,) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice update the fee percentage (1-100)
     */
    function updateFeePercent(uint16 newFee) external onlyOwner {
        require(newFee > 0, "Fee cannot be 0%");
        require(newFee <= 100, "Fee cannot be more than 100%");

        feePercent = newFee;
    }

    /**
     * @notice Update the minimum fee (in ethers)
     */
    function updateMinFee(uint256 newMinFee) external onlyOwner {
        require(newMinFee > 0, "Minimum fee cannot be 0");

        minFee = newMinFee;
    }

    /**
      * @notice Update the listing fee (in ethers)
      */
    function updateListingFee(uint256 newListingFee) external onlyOwner {
        require(newListingFee > 0, "Listing fee cannot be 0");

        listingFee = newListingFee;
    }

    ////////////////////////////////////////////////
    // Internal functions
    ////////////////////////////////////////////////

    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
 
