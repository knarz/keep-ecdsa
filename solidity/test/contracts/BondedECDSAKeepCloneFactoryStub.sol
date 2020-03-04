pragma solidity ^0.5.4;

import "../../contracts/BondedECDSAKeep.sol";
import "../../contracts/CloneFactory.sol";

/// @title Bonded ECDSA Keep Factory Stub using clone factory.
/// @dev This contract is for testing purposes only.
contract BondedECDSAKeepCloneFactory is CloneFactory {
    address public masterBondedECDSAKeepAddress;

    constructor(address _masterBondedECDSAKeepAddress) public {
        masterBondedECDSAKeepAddress = _masterBondedECDSAKeepAddress;
    }

    event BondedECDSAKeepCreated(address keepAddress);

    function newKeep(
        address _owner,
        address[] calldata _members,
        uint256 _honestThreshold,
        address _tokenStaking,
        address _keepBonding,
        address payable _keepFactory
    ) external payable returns (address keepAddress) {
        keepAddress = createClone(masterBondedECDSAKeepAddress);
        assert(isClone(masterBondedECDSAKeepAddress, keepAddress));

        BondedECDSAKeep keep = BondedECDSAKeep(keepAddress);
        keep.initialize(
            _owner,
            _members,
            _honestThreshold,
            _tokenStaking,
            _keepBonding,
            _keepFactory
        );

        emit BondedECDSAKeepCreated(keepAddress);
    }
}
