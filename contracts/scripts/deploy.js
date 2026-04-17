const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying TrustScore contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📦 Deploying with account: ${deployer.address}`);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH/MATIC\n`);

  // Deploy the contract
  const TrustScore = await ethers.getContractFactory("TrustScore");
  const trustScore = await TrustScore.deploy();
  await trustScore.waitForDeployment();

  const contractAddress = await trustScore.getAddress();
  console.log(`✅ TrustScore deployed to: ${contractAddress}`);
  console.log(`🔗 Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`\n📝 Add this to your backend .env:`);
  console.log(`TRUST_SCORE_CONTRACT_ADDRESS=${contractAddress}`);

  // Verify the deployment
  const totalScored = await trustScore.totalScoredWallets();
  console.log(`\n🔍 Verification: totalScoredWallets = ${totalScored}`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
