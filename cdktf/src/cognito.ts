import {
  provider as awsProvider,
  cognitoUserPool,
  cognitoUserPoolClient,
} from "@cdktf/provider-aws";
import { CognitoUserPoolConfig } from "@cdktf/provider-aws/lib/cognito-user-pool";
import { provider as randomProvider } from "@cdktf/provider-random";
import { TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";

const userpollConfig = (name: string): CognitoUserPoolConfig => ({
  name: `userpool-${name}`,
  schema: [
    {
      name: "cpf",
      attributeDataType: "String",
      mutable: true,
      stringAttributeConstraints: {
        minLength: "11",
        maxLength: "11",
      },
    },
  ],
  // Set the username attributes
  usernameAttributes: ["email"],
  autoVerifiedAttributes: ["email"],
  accountRecoverySetting: {
    recoveryMechanism: [
      {
        name: "verified_email",
        priority: 1,
      },
    ],
  },
});

class CognitoStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, "aws", {
      region: "us-east-1",
    });
    new randomProvider.RandomProvider(this, "cognito-random");

    const userPool = new cognitoUserPool.CognitoUserPool(
      this,
      "UserPool",
      userpollConfig(`${name}`)
    );

    // Create a Cognito User Pool Client
    const userPoolClient = new cognitoUserPoolClient.CognitoUserPoolClient(
      this,
      "UserPoolClient",
      {
        name: `userpool-client-${name}`,
        userPoolId: userPool.id,
        explicitAuthFlows: ["ADMIN_NO_SRP_AUTH"],
      }
    );

    new TerraformOutput(this, "userPoolId", { value: userPool.id });
    new TerraformOutput(this, "userPoolClientId", { value: userPoolClient.id });
  }
}

export { CognitoStack };
