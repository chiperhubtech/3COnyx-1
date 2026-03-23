import * as cdk      from "aws-cdk-lib";
import * as ddb      from "aws-cdk-lib/aws-dynamodb";
import * as kms      from "aws-cdk-lib/aws-kms";
import * as s3       from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Config }    from "../config";

interface DataStackProps extends cdk.StackProps {
  encryptionKey: kms.Key;
}

/**
 * DataStack
 * ─────────
 * All persistent storage for the 3C Agentic OS.
 *
 *  Table                  PK                  SK                   Purpose
 *  ─────────────────────────────────────────────────────────────────────────────
 *  ReputationLedger       MEMBER#{id}         TXN#{timestamp}      Two-way I-95 reputation mesh
 *  VehiclePassports       VIN#{vin}           EVENT#{timestamp}    Digital vehicle passport (immutable)
 *  DynastyWallet          WALLET#{memberId}   SPLIT#{txnId}        Triple-split escrow records
 *  AuditVault             AGENT#{name}        DECISION#{timestamp} SOC2 immutable decision ledger
 *  AgentTaskQueue         TASK#{id}           STATUS#{timestamp}   Goal-seeking agent task queue
 *  Subscriptions          MEMBER#{id}         PLAN#{planId}        $99/mo subscription records
 *
 *  All tables: encrypted with CMK, point-in-time recovery, on-demand billing.
 *  Exports to S3 + Glacier (WORM) for 7-year retention (SOC2 CC6.5).
 */
export class DataStack extends cdk.Stack {
  public readonly reputationLedger: ddb.Table;
  public readonly vehiclePassports: ddb.Table;
  public readonly dynastyWallet:    ddb.Table;
  public readonly auditVault:       ddb.Table;
  public readonly agentTaskQueue:   ddb.Table;
  public readonly subscriptions:    ddb.Table;
  public readonly archiveBucket:    s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { encryptionKey } = props;
    const tableDefaults = {
      billingMode:        ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryptionKey,
      encryption:         ddb.TableEncryption.CUSTOMER_MANAGED,
      removalPolicy:      cdk.RemovalPolicy.RETAIN,
    } satisfies Partial<ddb.TableProps>;

    // ── Two-Way Reputation Ledger ─────────────────────────────────────────────
    this.reputationLedger = new ddb.Table(this, "ReputationLedger", {
      ...tableDefaults,
      tableName:    Config.tables.reputationLedger,
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },  // MEMBER#{id}
      sortKey:      { name: "sk", type: ddb.AttributeType.STRING },  // TXN#{timestamp}
      stream:       ddb.StreamViewType.NEW_AND_OLD_IMAGES,           // feeds real-time score updates
    });

    // GSI: query all transactions for a given dealer
    this.reputationLedger.addGlobalSecondaryIndex({
      indexName:            "dealer-index",
      partitionKey:         { name: "dealerId",  type: ddb.AttributeType.STRING },
      sortKey:              { name: "createdAt", type: ddb.AttributeType.STRING },
      projectionType:       ddb.ProjectionType.ALL,
    });

    // GSI: query by reputation score for leaderboard / I-95 spine ranking
    this.reputationLedger.addGlobalSecondaryIndex({
      indexName:      "score-index",
      partitionKey:   { name: "region",       type: ddb.AttributeType.STRING },
      sortKey:        { name: "reputationScore", type: ddb.AttributeType.NUMBER },
      projectionType: ddb.ProjectionType.ALL,
    });

    // ── Digital Vehicle Passports (immutable event log) ───────────────────────
    this.vehiclePassports = new ddb.Table(this, "VehiclePassports", {
      ...tableDefaults,
      tableName:    Config.tables.vehiclePassports,
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },  // VIN#{vin}
      sortKey:      { name: "sk", type: ddb.AttributeType.STRING },  // EVENT#{timestamp}
      stream:       ddb.StreamViewType.NEW_IMAGE,
      // TTL NOT set — vehicle history must never expire
    });

    this.vehiclePassports.addGlobalSecondaryIndex({
      indexName:      "owner-index",
      partitionKey:   { name: "ownerId",    type: ddb.AttributeType.STRING },
      sortKey:        { name: "eventType",  type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // ── Dynasty Wallet — Triple-Split Escrow ──────────────────────────────────
    this.dynastyWallet = new ddb.Table(this, "DynastyWallet", {
      ...tableDefaults,
      tableName:    Config.tables.dynastyWallet,
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },  // WALLET#{memberId}
      sortKey:      { name: "sk", type: ddb.AttributeType.STRING },  // SPLIT#{txnId}
      stream:       ddb.StreamViewType.NEW_AND_OLD_IMAGES,           // triggers Stripe payout lambda
    });

    this.dynastyWallet.addGlobalSecondaryIndex({
      indexName:      "status-index",
      partitionKey:   { name: "status",    type: ddb.AttributeType.STRING },
      sortKey:        { name: "createdAt", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // GSI: referrer dividend tracking
    this.dynastyWallet.addGlobalSecondaryIndex({
      indexName:      "referrer-index",
      partitionKey:   { name: "referrerId", type: ddb.AttributeType.STRING },
      sortKey:        { name: "createdAt",  type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // ── SOC2 Audit Vault (immutable, append-only) ─────────────────────────────
    this.auditVault = new ddb.Table(this, "AuditVault", {
      ...tableDefaults,
      tableName:    Config.tables.auditVault,
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },  // AGENT#{name}
      sortKey:      { name: "sk", type: ddb.AttributeType.STRING },  // DECISION#{timestamp}
      // DynamoDB condition expressions enforce append-only (no updates/deletes in app code)
    });

    // GSI: SOC2 auditor cross-query by decision type
    this.auditVault.addGlobalSecondaryIndex({
      indexName:      "decision-type-index",
      partitionKey:   { name: "decisionType", type: ddb.AttributeType.STRING },
      sortKey:        { name: "sk",           type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // ── Agent Task Queue (Goal-Seeking autonomy state) ────────────────────────
    this.agentTaskQueue = new ddb.Table(this, "AgentTaskQueue", {
      ...tableDefaults,
      tableName:    Config.tables.agentTaskQueue,
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },  // TASK#{id}
      sortKey:      { name: "sk", type: ddb.AttributeType.STRING },  // STATUS#{timestamp}
      timeToLiveAttribute: "ttl",   // completed tasks auto-expire after 30 days
      stream:       ddb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.agentTaskQueue.addGlobalSecondaryIndex({
      indexName:      "agent-status-index",
      partitionKey:   { name: "agentName", type: ddb.AttributeType.STRING },
      sortKey:        { name: "status",    type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // ── Member Subscriptions ($99/mo Revenue Gate) ────────────────────────────
    this.subscriptions = new ddb.Table(this, "Subscriptions", {
      ...tableDefaults,
      tableName:    Config.tables.subscriptions,
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },  // MEMBER#{id}
      sortKey:      { name: "sk", type: ddb.AttributeType.STRING },  // PLAN#{planId}
    });

    this.subscriptions.addGlobalSecondaryIndex({
      indexName:      "stripe-sub-index",
      partitionKey:   { name: "stripeSubscriptionId", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // ── S3 Glacier Archive (WORM — 7-year SOC2 retention) ────────────────────
    this.archiveBucket = new s3.Bucket(this, "AuditArchive", {
      bucketName:            `${Config.appName}-audit-archive-${this.account}`,
      encryptionKey,
      encryption:            s3.BucketEncryption.KMS,
      versioned:             true,
      objectLockEnabled:     true,   // WORM — prevents deletion
      blockPublicAccess:     s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL:            true,
      removalPolicy:         cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id:         "glacier-archive",
          enabled:    true,
          transitions: [
            { storageClass: s3.StorageClass.INTELLIGENT_TIERING, transitionAfter: cdk.Duration.days(30) },
            { storageClass: s3.StorageClass.GLACIER,             transitionAfter: cdk.Duration.days(90) },
          ],
        },
      ],
    });

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "ReputationTableName",  { value: this.reputationLedger.tableName, exportName: "3c-reputation-table" });
    new cdk.CfnOutput(this, "VehiclePassportTable", { value: this.vehiclePassports.tableName, exportName: "3c-dvp-table"        });
    new cdk.CfnOutput(this, "WalletTableName",      { value: this.dynastyWallet.tableName,    exportName: "3c-wallet-table"     });
    new cdk.CfnOutput(this, "AuditVaultName",       { value: this.auditVault.tableName,       exportName: "3c-audit-table"      });
    new cdk.CfnOutput(this, "ArchiveBucketName",    { value: this.archiveBucket.bucketName,   exportName: "3c-archive-bucket"   });
  }
}
