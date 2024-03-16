import {
  iamRole,
  iamRolePolicy,
  iamRolePolicyAttachment,
  lambdaFunction,
  lambdaPermission,
  provider as awsProvider,
  s3Bucket,
  s3Object,
} from "@cdktf/provider-aws";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
import { pet, provider as randomProvider } from "@cdktf/provider-random";
import {
  AssetType,
  TerraformAsset,
  TerraformOutput,
  TerraformStack,
} from "cdktf";
import { Construct } from "constructs";
import * as path from "path";
import { apiGatewayConfig } from "../apigateway";

interface LambdaFunctionConfig {
  path: string;
  handler: string;
  runtime: string;
  stageName: string;
  version: string;
  region: string;
  environment?: { [key: string]: string };
}

const lambdaRolePolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Action: "sts:AssumeRole",
      Principal: {
        Service: "lambda.amazonaws.com",
      },
      Effect: "Allow",
      Sid: "",
    },
  ],
};

export class LambdaStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: LambdaFunctionConfig) {
    super(scope, name);

    new awsProvider.AwsProvider(this, "aws", {
      region: config.region,
    });

    new randomProvider.RandomProvider(this, "random");

    // Create random value
    const petName = new pet.Pet(this, "random-name", {
      length: 2,
    });

    // Create Lambda executable
    const asset = new TerraformAsset(this, "lambda-asset", {
      path: path.resolve(__dirname, config.path),
      type: AssetType.ARCHIVE, // if left empty it infers directory and file
    });

    // Create unique S3 bucket that hosts Lambda executable
    const bucket = new s3Bucket.S3Bucket(this, "bucket", {
      bucketPrefix: `cdktf-${name}`,
    });

    // Upload Lambda zip file to newly created S3 bucket
    const lambdaArchive = new s3Object.S3Object(this, "lambda-archive", {
      bucket: bucket.bucket,
      key: `${config.version}/${asset.fileName}`,
      source: asset.path, // returns a posix path
    });

    // Create Lambda role
    const role = new iamRole.IamRole(this, "lambda-exec", {
      name: `cdktf-${name}-${petName.id}`,
      assumeRolePolicy: JSON.stringify(lambdaRolePolicy),
    });

    new iamRolePolicy.IamRolePolicy(this, "LambdaRolePolicy", {
      role: role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: "ssm:GetParameter",
            Resource: "*",
          },
        ],
      }),
    });

    // Add execution role for lambda to write to CloudWatch logs
    new iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "lambda-managed-policy",
      {
        policyArn:
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        role: role.name,
      }
    );

    // Create Lambda function
    const lambdaFunc = new lambdaFunction.LambdaFunction(
      this,
      "auth-lambda-func",
      {
        functionName: `cdktf-${name}-${petName.id}`,
        s3Bucket: bucket.bucket,
        s3Key: lambdaArchive.key,
        handler: config.handler,
        runtime: config.runtime,
        publish: true,
        role: role.arn,
        ...(config.environment && {
          environment: { variables: config.environment },
        }),
      }
    );

    const { api, stage } = apiGatewayConfig(this, name, lambdaFunc.invokeArn);

    new lambdaPermission.LambdaPermission(this, "apigw-lambda", {
      functionName: lambdaFunc.functionName,
      action: "lambda:InvokeFunction",
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });

    const url = `https://${api.id}.execute-api.${config.region}.amazonaws.com/${stage.stageName}`;

    new TerraformOutput(this, "url", {
      value: url,
    });

    new SsmParameter(this, "LambdaUrl", {
      name: "/lambda-auth/lambdaUrl",
      type: "String",
      value: url,
    });
  }
}
