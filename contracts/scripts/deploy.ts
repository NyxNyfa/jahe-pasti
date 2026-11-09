import { ethers, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== Deploying JahePastiTracker Smart Contract ===");

  const [admin, farmer, cooperative, qc] = await ethers.getSigners();
  console.log("Admin account:", admin.address);
  console.log("Farmer account (Simulasi Sambirata):", farmer.address);
  console.log("Cooperative account (Simulasi Koperasi):", cooperative.address);
  console.log("QC account (Simulasi QC Pabrik):", qc.address);

  const JahePastiTracker = await ethers.getContractFactory("JahePastiTracker");
  const tracker = await JahePastiTracker.deploy(admin.address);
  await tracker.waitForDeployment();

  const contractAddress = await tracker.getAddress();
  console.log("JahePastiTracker deployed to:", contractAddress);

  // Define roles
  const FARMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE"));
  const COOPERATIVE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COOPERATIVE_ROLE"));
  const QC_ROLE = ethers.keccak256(ethers.toUtf8Bytes("QC_ROLE"));

  console.log("Granting initial roles to demo accounts...");
  let tx = await tracker.connect(admin).grantRole(FARMER_ROLE, farmer.address);
  await tx.wait();

  tx = await tracker.connect(admin).grantRole(COOPERATIVE_ROLE, cooperative.address);
  await tx.wait();

  tx = await tracker.connect(admin).grantRole(QC_ROLE, qc.address);
  await tx.wait();

  console.log("Roles successfully assigned.");

  // Export contract deployment address and accounts
  const deploymentInfo = {
    contractAddress,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    accounts: {
      admin: admin.address,
      farmer: farmer.address,
      cooperative: cooperative.address,
      qc: qc.address,
    },
    deployedAt: new Date().toISOString(),
  };

  const deployedPath = path.join(__dirname, "..", "deployed-address.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info exported to:", deployedPath);

  // Export contract ABI
  const artifact = await artifacts.readArtifact("JahePastiTracker");
  const abiPath = path.join(__dirname, "..", "JahePastiTracker.abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("Contract ABI exported to:", abiPath);

  console.log("=== Deployment Completed Successfully ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
