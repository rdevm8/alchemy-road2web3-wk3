// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error ChainBattles__MaxSupplyReached();
error ChainBattles__NotEnoughETHSent();
error ChainBattles__TokenIDNotExists();
error ChainBattles__NotApprovedOrOwner();
error ChainBattles__WithdrawFailed();

contract ChainBattles is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    uint256 private immutable i_mintFee;
    uint256 private immutable i_maxSupply;
    address payable private s_withdrawalAddress;
    Counters.Counter private s_tokenIds;

    mapping(uint256 => uint256) private s_tokenIdToLevels;

    event MintedNft(uint256 indexed tokenId);
    event TrainedNft(uint256 indexed tokenId, uint256 level);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 mintFee,
        uint256 maxSupply
    ) ERC721(tokenName, tokenSymbol) {
        i_mintFee = mintFee;
        i_maxSupply = maxSupply;
        s_withdrawalAddress = payable(msg.sender);
    }

    // MINT
    function mint() public payable {
        if (msg.value < i_mintFee) {
            revert ChainBattles__NotEnoughETHSent();
        }

        if (s_tokenIds.current() == i_maxSupply) {
            revert ChainBattles__MaxSupplyReached();
        }

        s_tokenIds.increment();
        uint256 newTokenId = s_tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        s_tokenIdToLevels[newTokenId] = 0;
        _setTokenURI(newTokenId, getTokenURI(newTokenId));

        emit MintedNft(newTokenId);
    }

    // TRAIN
    function train(uint256 tokenId) public {
        if (!_exists(tokenId)) {
            revert ChainBattles__TokenIDNotExists();
        }

        if (!_isApprovedOrOwner(msg.sender, tokenId)) {
            revert ChainBattles__NotApprovedOrOwner();
        }

        uint256 newLevel = s_tokenIdToLevels[tokenId] + 1;
        s_tokenIdToLevels[tokenId] = newLevel;
        _setTokenURI(tokenId, getTokenURI(tokenId));

        emit TrainedNft(tokenId, newLevel);
    }

    // WITHDRAW
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;

        (bool success, ) = s_withdrawalAddress.call{ value: amount }("");

        if (!success) {
            revert ChainBattles__WithdrawFailed();
        }
    }

    function setWithdrawalAddress(address newOwner) public onlyOwner {
        s_withdrawalAddress = payable(newOwner);
    }

    // OVERRIDES
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // FUNCTIONALITIES
    function generateCharacter(uint256 tokenId) internal view returns (string memory) {
        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
            "<style>.base { fill: white; font-family: serif; font-size: 14px; }</style>",
            '<rect width="100%" height="100%" fill="black" />',
            '<text x="50%" y="40%" class="base" dominant-baseline="middle" text-anchor="middle">',
            "Warrior",
            "</text>",
            '<text x="50%" y="50%" class="base" dominant-baseline="middle" text-anchor="middle">',
            "Levels: ",
            (getTokenIdToLevels(tokenId)).toString(),
            "</text>",
            "</svg>"
        );
        return string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(svg)));
    }

    function getTokenURI(uint256 tokenId) internal view returns (string memory) {
        bytes memory dataURI = abi.encodePacked(
            "{",
            '"name": "Chain Battles #',
            tokenId.toString(),
            '",',
            '"description": "Battles on chain",',
            '"image": "',
            generateCharacter(tokenId),
            '"',
            "}"
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(dataURI)));
    }

    // GETTERS
    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getMaxSupply() public view returns (uint256) {
        return i_maxSupply;
    }

    function getTokenIdToLevels(uint256 tokenId) public view returns (uint256) {
        return s_tokenIdToLevels[tokenId];
    }

    function getMinted() public view returns (uint256) {
        return s_tokenIds.current();
    }

    function getWithdrawalAddress() public view returns (address) {
        return s_withdrawalAddress;
    }
}
