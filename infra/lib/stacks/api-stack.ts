import * as cdk          from "aws-cdk-lib";
import * as lambda        from "aws-cdk-lib/aws-lambda";
import * as apigwv2       from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations  from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cognito       from "aws-cdk-lib/aws-cognito";
import * as iam           from "aws-cdk-lib/aws-iam";
import * as logs          from "aws-cdk-lib/aws-logs";
import { Construct }      from "constructs";
import { Config }         from "../config";

interface ApiStackProps extends cdk.StackProps {
  guardianFn:              lambda.Function;
  conciergeFn:             lambda.Function;
  marketcheckFn:           lambda.Function;
  checkrFn:                lambda.Function;
  smartcarFn:              lambda.Function;
  stripeFn:                lambda.Function;
  hypertrackFn:            lambda.Function;
  vehiclePassportFn:       lambda.Function;
  walletFn:                lambda.Function;
  reputationFn:            lambda.Function;
  repairWorkflowArn:       string;
  purchaseWorkflowArn:     string;
  subscriptionWorkflowArn: string;
}

/**
 * ApiStack
 * ────────
 * API Gateway v2 (HTTP) — single regional endpoint fronting all 7 agents
 * plus router lambdas. WAFv2 attached in SecurityStack.
 *
 *  Route                        Integration           Auth
 *  ─────────────────────────────────────────────────────────────────
 *  POST /concierge/chat         ConciergeFn           Cognito JWT
 *  GET  /guardian/status        GuardianFn            Cognito JWT
 *  POST /guardian/alert         GuardianFn            Cognito JWT
 *  GET  /marketcheck/price      MarketCheckFn         Cognito JWT
 *  POST /checkr/bgc             CheckrFn              Cognito JWT (admin)
 *  GET  /smartcar/telemetry     SmartcarFn            Cognito JWT
 *  POST /stripe/purchase        StripeFn              Cognito JWT
 *  POST /stripe/subscription    StripeFn              Cognito JWT
 *  POST /stripe/webhook         StripeFn              NONE (Stripe sig)
 *  GET  /hypertrack/delivery    HyperTrackFn          Cognito JWT
 *  GET  /vehicles/{vin}         VehiclePassportFn     Cognito JWT
 *  POST /vehicles               VehiclePassportFn     Cognito JWT
 *  GET  /wallet/{memberId}      WalletFn              Cognito JWT
 *  GET  /reputation/{memberId}  ReputationFn          Cognito JWT
 *
 *  Throttle: 10,000 req/s burst, 5,000 req/s steady-state (scales to 1M users).
 */
export class ApiStack extends cdk.Stack {
  public readonly httpApi:   apigwv2.HttpApi;
  public readonly userPool:  cognito.UserPool;
  public readonly apiUrl:    string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      guardianFn, conciergeFn, marketcheckFn, checkrFn,
      smartcarFn, stripeFn, hypertrackFn,
      vehiclePassportFn, walletFn, reputationFn,
      repairWorkflowArn, purchaseWorkflowArn, subscriptionWorkflowArn,
    } = props;

    // ── Cognito User Pool (member authentication) ─────────────────────────────
    this.userPool = new cognito.UserPool(this, "3cUserPool", {
      userPoolName:          `${Config.appName}-members`,
      selfSignUpEnabled:     true,
      signInAliases:         { email: true, phone: true },
      mfa:                   cognito.Mfa.OPTIONAL,
      mfaSecondFactor:       { sms: true, otp: true },
      passwordPolicy: {
        minLength:        12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits:    true,
        requireSymbols:   true,
      },
      accountRecovery:      cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:        cdk.RemovalPolicy.RETAIN,
      // Device tracking for security anomaly detection
      deviceTracking: {
        challengeRequiredOnNewDevice: true,
        deviceOnlyRememberedOnUserPrompt: false,
      },
      // Lambda triggers — hook Checkr BGC into post-confirmation
      lambdaTriggers: {
        postConfirmation: checkrFn,   // auto-trigger BGC on account activation
      },
    });

    const userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName:          `${Config.appName}-web`,
      authFlows: {
        userPassword:              true,
        userSrp:                   true,
        custom:                    true,
      },
      oAuth: {
        flows:       { authorizationCodeGrant: true, implicitCodeGrant: false },
        scopes:      [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [`https://app.cuxtomcandyclub.com/auth/callback`, `http://localhost:5173/auth/callback`],
        logoutUrls:   [`https://app.cuxtomcandyclub.com`, `http://localhost:5173`],
      },
      accessTokenValidity:  cdk.Duration.hours(1),
      idTokenValidity:      cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // Cognito JWT authorizer
    const jwtAuthorizer = new apigwv2.HttpJwtAuthorizer("CognitoAuthorizer", this.userPool.userPoolProviderUrl, {
      jwtAudience: [userPoolClient.userPoolClientId],
    });

    // ── Access Log Group ──────────────────────────────────────────────────────
    const accessLogGroup = new logs.LogGroup(this, "ApiAccessLogs", {
      logGroupName: "/3c-onyx/api-gateway/access",
      retention:    logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── HTTP API ──────────────────────────────────────────────────────────────
    this.httpApi = new apigwv2.HttpApi(this, "3cHttpApi", {
      apiName:          `${Config.appName}-api`,
      description:      "3C Onyx Agentic OS — Production API",
      corsPreflight: {
        allowHeaders:     ["Authorization", "Content-Type", "X-3C-Member-Id", "X-3C-Request-Id"],
        allowMethods:     [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.POST, apigwv2.CorsHttpMethod.OPTIONS],
        allowOrigins:     ["https://app.cuxtomcandyclub.com", "http://localhost:5173"],
        exposeHeaders:    ["X-3C-Request-Id"],
        maxAge:           cdk.Duration.seconds(86400),
        allowCredentials: true,
      },
      defaultAuthorizer: jwtAuthorizer,
    });

    // Helper to register routes
    const route = (
      method:   apigwv2.HttpMethod,
      path:     string,
      fn:       lambda.Function,
      auth?:    apigwv2.IHttpRouteAuthorizer | undefined,
    ) => {
      this.httpApi.addRoutes({
        path,
        methods:     [method],
        integration: new integrations.HttpLambdaIntegration(`Int${path.replace(/\W/g, "")}`, fn),
        authorizer:  auth ?? jwtAuthorizer,
      });
    };

    // ── Concierge AI ──────────────────────────────────────────────────────────
    route(apigwv2.HttpMethod.POST, "/concierge/chat",      conciergeFn);
    route(apigwv2.HttpMethod.POST, "/concierge/intent",    conciergeFn);   // Fullpath shopper intent

    // ── Guardian V2X ─────────────────────────────────────────────────────────
    route(apigwv2.HttpMethod.GET,  "/guardian/status",     guardianFn);
    route(apigwv2.HttpMethod.POST, "/guardian/alert",      guardianFn);
    route(apigwv2.HttpMethod.GET,  "/guardian/strikes",    guardianFn);
    route(apigwv2.HttpMethod.GET,  "/guardian/mesh",       guardianFn);

    // ── MarketCheck Wholesale Engine ──────────────────────────────────────────
    route(apigwv2.HttpMethod.GET,  "/marketcheck/price",   marketcheckFn);
    route(apigwv2.HttpMethod.GET,  "/marketcheck/auction", marketcheckFn);
    route(apigwv2.HttpMethod.GET,  "/marketcheck/search",  marketcheckFn);

    // ── Checkr BGC ────────────────────────────────────────────────────────────
    route(apigwv2.HttpMethod.POST, "/checkr/bgc",          checkrFn);
    route(apigwv2.HttpMethod.GET,  "/checkr/report/{id}",  checkrFn);

    // ── Smartcar Connected Vehicle ────────────────────────────────────────────
    route(apigwv2.HttpMethod.GET,  "/smartcar/telemetry",  smartcarFn);
    route(apigwv2.HttpMethod.POST, "/smartcar/lock",       smartcarFn);
    route(apigwv2.HttpMethod.POST, "/smartcar/unlock",     smartcarFn);

    // ── Stripe Dynasty Wallet ─────────────────────────────────────────────────
    route(apigwv2.HttpMethod.POST, "/stripe/purchase",                  stripeFn);
    route(apigwv2.HttpMethod.POST, "/stripe/subscription",              stripeFn);
    route(apigwv2.HttpMethod.POST, "/stripe/webhook",                   stripeFn, apigwv2.HttpNoneAuthorizer.fromHttpNoneAuthorizer());
    route(apigwv2.HttpMethod.GET,  "/stripe/subscription/{memberId}",   stripeFn);

    // ── HyperTrack Delivery ───────────────────────────────────────────────────
    route(apigwv2.HttpMethod.GET,  "/hypertrack/delivery/{id}", hypertrackFn);
    route(apigwv2.HttpMethod.POST, "/hypertrack/assign",        hypertrackFn);

    // ── Digital Vehicle Passports ─────────────────────────────────────────────
    route(apigwv2.HttpMethod.GET,  "/vehicles/{vin}",    vehiclePassportFn);
    route(apigwv2.HttpMethod.POST, "/vehicles",          vehiclePassportFn);

    // ── Dynasty Wallet ────────────────────────────────────────────────────────
    route(apigwv2.HttpMethod.GET,  "/wallet/{memberId}", walletFn);

    // ── Reputation Ledger ─────────────────────────────────────────────────────
    route(apigwv2.HttpMethod.GET,  "/reputation/{memberId}", reputationFn);

    // ── Step Functions START endpoint (POST /workflows/{type}) ───────────────
    // API Gateway → Step Functions direct integration (no extra lambda needed)
    const sfnRole = new iam.Role(this, "ApiSfnRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions:   ["states:StartExecution"],
      resources: [repairWorkflowArn, purchaseWorkflowArn, subscriptionWorkflowArn],
    }));

    // Store the SFN ARNs as CfnOutputs — the mobile/web SDK reads these
    new cdk.CfnOutput(this, "RepairSfnArn",    { value: repairWorkflowArn,       exportName: "3c-api-repair-sfn"    });
    new cdk.CfnOutput(this, "PurchaseSfnArn",  { value: purchaseWorkflowArn,     exportName: "3c-api-purchase-sfn"  });
    new cdk.CfnOutput(this, "SubscriptionSfnArn", { value: subscriptionWorkflowArn, exportName: "3c-api-sub-sfn"    });

    this.apiUrl = this.httpApi.apiEndpoint;

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "ApiUrl", {
      value:       this.apiUrl,
      description: "3C Onyx production API endpoint — update VITE_API_URL with this value",
      exportName:  "3c-api-url",
    });
    new cdk.CfnOutput(this, "UserPoolId", {
      value:       this.userPool.userPoolId,
      exportName:  "3c-cognito-user-pool-id",
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value:       userPoolClient.userPoolClientId,
      exportName:  "3c-cognito-client-id",
    });
  }
}
