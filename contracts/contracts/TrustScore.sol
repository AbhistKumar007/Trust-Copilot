// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustScore
 * @notice On-chain wallet reputation storage contract for TrustCopilot.
 * @dev Stores risk scores (0-100) for wallet addresses, allowing authorized
 *      updaters to submit AI-generated trust scores. Scores are publicly
 *      readable for transparency.
 */
contract TrustScore is Ownable {
    // ─── Structs ──────────────────────────────────────────────────────────────

    struct ScoreRecord {
        uint8 score;        // 0 = safest, 100 = most dangerous
        uint256 timestamp;  // Unix timestamp of last update
        address updatedBy;  // Address that submitted the score
        string ipfsHash;    // Optional: IPFS CID for full AI report
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Mapping from wallet address to its score record
    mapping(address => ScoreRecord) private _scores;

    /// @notice Authorized updaters who can submit scores (e.g., backend oracle)
    mapping(address => bool) public authorizedUpdaters;

    /// @notice Total number of wallets scored
    uint256 public totalScoredWallets;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ScoreUpdated(
        address indexed wallet,
        uint8 score,
        address indexed updatedBy,
        uint256 timestamp
    );

    event UpdaterAuthorized(address indexed updater, bool status);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error InvalidScore(uint8 score);
    error NotAuthorized(address caller);
    error InvalidAddress(address wallet);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAuthorized() {
        if (!authorizedUpdaters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }

    modifier validScore(uint8 score) {
        if (score > 100) revert InvalidScore(score);
        _;
    }

    modifier validWallet(address wallet) {
        if (wallet == address(0)) revert InvalidAddress(wallet);
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {
        // Owner is automatically an authorized updater
        authorizedUpdaters[msg.sender] = true;
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /**
     * @notice Update the risk score for a wallet address.
     * @dev Only authorized updaters or the owner can call this function.
     * @param wallet The wallet address being scored.
     * @param score  Risk score from 0 (safest) to 100 (most dangerous).
     * @param ipfsHash Optional IPFS hash for the full AI-generated report.
     */
    function updateScore(
        address wallet,
        uint8 score,
        string calldata ipfsHash
    ) external onlyAuthorized validScore(score) validWallet(wallet) {
        bool isNew = _scores[wallet].timestamp == 0;

        _scores[wallet] = ScoreRecord({
            score: score,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            ipfsHash: ipfsHash
        });

        if (isNew) {
            totalScoredWallets++;
        }

        emit ScoreUpdated(wallet, score, msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieve the score record for a wallet.
     * @param wallet The wallet address to query.
     * @return score     The risk score (0-100). Returns 0 if not yet scored.
     * @return timestamp Unix timestamp of last update. Returns 0 if not scored.
     * @return updatedBy Address that submitted the score.
     * @return ipfsHash  IPFS hash for the AI report (may be empty).
     */
    function getScore(address wallet)
        external
        view
        validWallet(wallet)
        returns (
            uint8 score,
            uint256 timestamp,
            address updatedBy,
            string memory ipfsHash
        )
    {
        ScoreRecord memory record = _scores[wallet];
        return (record.score, record.timestamp, record.updatedBy, record.ipfsHash);
    }

    /**
     * @notice Check whether a wallet has been scored before.
     * @param wallet The wallet address to check.
     */
    function hasScore(address wallet) external view returns (bool) {
        return _scores[wallet].timestamp != 0;
    }

    /**
     * @notice Batch update scores for multiple wallets.
     * @dev Gas-efficient bulk update for backend oracle submissions.
     */
    function batchUpdateScores(
        address[] calldata wallets,
        uint8[] calldata scores,
        string[] calldata ipfsHashes
    ) external onlyAuthorized {
        require(
            wallets.length == scores.length && wallets.length == ipfsHashes.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < wallets.length; i++) {
            if (wallets[i] == address(0)) continue;
            if (scores[i] > 100) continue;

            bool isNew = _scores[wallets[i]].timestamp == 0;

            _scores[wallets[i]] = ScoreRecord({
                score: scores[i],
                timestamp: block.timestamp,
                updatedBy: msg.sender,
                ipfsHash: ipfsHashes[i]
            });

            if (isNew) totalScoredWallets++;

            emit ScoreUpdated(wallets[i], scores[i], msg.sender, block.timestamp);
        }
    }

    // ─── Owner Functions ──────────────────────────────────────────────────────

    /**
     * @notice Grant or revoke updater authorization.
     * @param updater The address to authorize or de-authorize.
     * @param status  True to authorize, false to revoke.
     */
    function setUpdaterAuthorization(address updater, bool status)
        external
        onlyOwner
    {
        authorizedUpdaters[updater] = status;
        emit UpdaterAuthorized(updater, status);
    }
}
