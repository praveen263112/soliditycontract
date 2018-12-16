pragma solidity ^0.4.24;

import '../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';

contract StarNotary is ERC721 { 

   struct Star {
        string name;
        string starStory;
        string ra;
        string dec;
        string mag;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;

    mapping(uint256 => bool) public coordinateHash;

    function tokenIdToStarInfo(uint256 _tokenId) public view returns(string _name,string _starStory,string _ra,string _dec, string _mag) {
        Star storage star = tokenIdToStarInfo[_tokenId];

        _name = star.name;
        _starStory = star.starStory;
        _ra = concat("ra_",star.ra);
        _dec =concat("dec_",star.dec);
        _mag = concat("mag_",star.mag);

    }


     function concat(string _first,string _second) internal pure returns(string){

        bytes memory _firstBytes = bytes(_first);
        bytes memory _secondBytes = bytes(_second);

        string memory _temp = new string(_firstBytes.length + _secondBytes.length);
   
        bytes memory _newValue = bytes(_temp);

        uint i;
        uint j;

        for ( i=0 ; i<_firstBytes.length; i++){
            _newValue[j++] = _firstBytes[i];
        }

        for ( i=0 ; i<_secondBytes.length; i++){
            _newValue[j++] = _secondBytes[i];
        }

        return string(_newValue);
    }

    function checkIfStarExist (string _ra,string _dec,string _mag) public view returns(bool) {
         if (coordinateHash[uint256(keccak256(_ra,_dec,_mag))]==false) {
            coordinateHash[uint256(keccak256(_ra,_dec,_mag))] = true;
            return true;
        }
        return false;
    }


    function createStar(string _name,string _starStory,string _ra,string _dec,string _mag,uint256 _tokenId) public { 
        require (checkIfStarExist(_ra,_dec,_mag)==true);
        Star memory newStar = Star(
            {
                name:_name,
                starStory:_starStory,
                ra:_ra,
                dec:_dec,
                mag:_mag
            }
        );

        tokenIdToStarInfo[_tokenId] = newStar;

        _mint(msg.sender, _tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public { 
        require(this.ownerOf(_tokenId) == msg.sender);

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable { 
        // Verify if the star is for sale
        require(starsForSale[_tokenId] > 0);
        
        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        // Verify you have amount
        require(msg.value >= starCost);
        // If everything is okay transfer and clear states
        _removeTokenFrom(starOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);
        
        starOwner.transfer(starCost);

        if (msg.value > starCost) { 
            msg.sender.transfer(msg.value - starCost);
        }
    }
}