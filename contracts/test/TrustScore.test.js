const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustScore Contract", function () {
  let trustScore;
  let owner, updater, user, wallet1, wallet2;

  before(async function () {
    [owner, updater, user, wallet1, wallet2] = await ethers.getSigners();
    const TrustScore = await ethers.getContractFactory("TrustScore");
    trustScore = await TrustScore.deploy();
    await trustScore.waitForDeployment();
  });

  // ─── Deployment ──────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await trustScore.owner()).to.equal(owner.address);
    });

    it("Should authorize the owner as updater by default", async function () {
      expect(await trustScore.authorizedUpdaters(owner.address)).to.be.true;
    });

    it("Should start with zero scored wallets", async function () {
      expect(await trustScore.totalScoredWallets()).to.equal(0);
    });
  });

  // ─── Authorization ────────────────────────────────────────────────────────

  describe("Authorization", function () {
    it("Should allow owner to authorize an updater", async function () {
      await expect(trustScore.setUpdaterAuthorization(updater.address, true))
        .to.emit(trustScore, "UpdaterAuthorized")
        .withArgs(updater.address, true);

      expect(await trustScore.authorizedUpdaters(updater.address)).to.be.true;
    });

    it("Should reject non-owner from setting authorization", async function () {
      await expect(
        trustScore.connect(user).setUpdaterAuthorization(user.address, true)
      ).to.be.reverted;
    });

    it("Should allow owner to revoke updater authorization", async function () {
      await trustScore.setUpdaterAuthorization(updater.address, false);
      expect(await trustScore.authorizedUpdaters(updater.address)).to.be.false;
      // Re-authorize for subsequent tests
      await trustScore.setUpdaterAuthorization(updater.address, true);
    });
  });

  // ─── Score Updates ────────────────────────────────────────────────────────

  describe("Score Updates", function () {
    it("Should allow owner to update a wallet score", async function () {
      await expect(
        trustScore.updateScore(wallet1.address, 75, "QmTestHash123")
      )
        .to.emit(trustScore, "ScoreUpdated")
        .withArgs(wallet1.address, 75, owner.address, await getTimestamp());
    });

    it("Should allow authorized updater to update a score", async function () {
      await trustScore
        .connect(updater)
        .updateScore(wallet2.address, 30, "QmUpdaterHash456");

      const [score] = await trustScore.getScore(wallet2.address);
      expect(score).to.equal(30);
    });

    it("Should reject score > 100", async function () {
      await expect(
        trustScore.updateScore(wallet1.address, 101, "")
      ).to.be.revertedWithCustomError(trustScore, "InvalidScore");
    });

    it("Should reject update from unauthorized address", async function () {
      await expect(
        trustScore.connect(user).updateScore(wallet1.address, 50, "")
      ).to.be.revertedWithCustomError(trustScore, "NotAuthorized");
    });

    it("Should reject update for zero address", async function () {
      await expect(
        trustScore.updateScore(ethers.ZeroAddress, 50, "")
      ).to.be.revertedWithCustomError(trustScore, "InvalidAddress");
    });

    it("Should correctly track totalScoredWallets", async function () {
      const total = await trustScore.totalScoredWallets();
      expect(total).to.equal(2); // wallet1 + wallet2
    });

    it("Should not double-count wallet on re-score", async function () {
      await trustScore.updateScore(wallet1.address, 80, "");
      const total = await trustScore.totalScoredWallets();
      expect(total).to.equal(2); // Still 2
    });
  });

  // ─── Score Retrieval ──────────────────────────────────────────────────────

  describe("Score Retrieval", function () {
    it("Should return correct score data", async function () {
      const [score, timestamp, updatedBy, ipfsHash] =
        await trustScore.getScore(wallet1.address);

      expect(score).to.equal(80);
      expect(timestamp).to.be.gt(0);
      expect(updatedBy).to.equal(owner.address);
      expect(ipfsHash).to.equal("");
    });

    it("Should return zero values for unscored wallet", async function () {
      const [score, timestamp] = await trustScore.getScore(user.address);
      expect(score).to.equal(0);
      expect(timestamp).to.equal(0);
    });

    it("Should correctly report hasScore", async function () {
      expect(await trustScore.hasScore(wallet1.address)).to.be.true;
      expect(await trustScore.hasScore(user.address)).to.be.false;
    });
  });

  // ─── Batch Updates ────────────────────────────────────────────────────────

  describe("Batch Updates", function () {
    it("Should update multiple wallets in a batch", async function () {
      const [addr3, addr4, addr5] = await ethers.getSigners().then((s) =>
        s.slice(5, 8)
      );

      await trustScore.batchUpdateScores(
        [addr3.address, addr4.address, addr5.address],
        [10, 55, 99],
        ["hash1", "hash2", "hash3"]
      );

      const [s3] = await trustScore.getScore(addr3.address);
      const [s4] = await trustScore.getScore(addr4.address);
      const [s5] = await trustScore.getScore(addr5.address);

      expect(s3).to.equal(10);
      expect(s4).to.equal(55);
      expect(s5).to.equal(99);
    });
  });
});

// Helper: get the latest block timestamp approximation
async function getTimestamp() {
  return (await ethers.provider.getBlock("latest")).timestamp;
}
