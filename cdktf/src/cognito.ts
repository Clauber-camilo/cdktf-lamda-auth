import {
  cognitoUserPool,
  cognitoUserPoolClient,
  cognitoUserPoolDomain,
} from "@cdktf/provider-aws";
import { CognitoUserPoolConfig } from "@cdktf/provider-aws/lib/cognito-user-pool";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
import { TerraformOutput } from "cdktf";
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

const cognitoConfig = (instance: Construct, name: string, pet: string) => {
  const userPool = new cognitoUserPool.CognitoUserPool(
    instance,
    "UserPool",
    userpollConfig(`${name}`)
  );

  new cognitoUserPoolDomain.CognitoUserPoolDomain(instance, "UserPoolDomain", {
    domain: `pos-fiap-lanchonete-${name}-${pet}`,
    userPoolId: userPool.id,
  });

  const userPoolClient = new cognitoUserPoolClient.CognitoUserPoolClient(
    instance,
    "UserPoolClient",
    {
      name: `userpool-client-${name}`,
      userPoolId: userPool.id,
      explicitAuthFlows: ["ADMIN_NO_SRP_AUTH", "USER_PASSWORD_AUTH"],
      allowedOauthFlowsUserPoolClient: true,
      allowedOauthFlows: ["code", "implicit"],
      allowedOauthScopes: ["email", "openid"],
      callbackUrls: ["https://example.com"],
      supportedIdentityProviders: ["COGNITO"],
    }
  );

  new TerraformOutput(instance, "userPoolId", { value: userPool.id });
  new TerraformOutput(instance, "userPoolClientId", {
    value: userPoolClient.id,
  });

  new SsmParameter(instance, "UserPoolIdParameter", {
    name: "/lambda-auth/userPoolId",
    type: "String",
    value: userPool.id,
    overwrite: true,
  });

  new SsmParameter(instance, "UserPoolClientIdParameter", {
    name: "/lambda-auth/userPoolClientId",
    type: "String",
    value: userPoolClient.id,
    overwrite: true,
  });
};

export { cognitoConfig };
