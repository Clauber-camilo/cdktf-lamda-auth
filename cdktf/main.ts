import {
  App,
  AssetType,
  TerraformAsset,
  TerraformOutput,
  TerraformStack,
} from "cdktf";
import { Construct } from "constructs";
import * as path from "path";

import * as aws from "@cdktf/provider-aws";
import * as random from "@cdktf/provider-random";
import { CognitoStack } from "./src/cognito";
import { apiGatewayConfig } from "./src/apigateway";

interface LambdaFunctionConfig {
  path: string;
  handler: string;
  runtime: string;
  stageName: string;
  version: string;
  region: string;
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

class LambdaStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: LambdaFunctionConfig) {
    super(scope, name);

    new aws.provider.AwsProvider(this, "aws", {
      region: config.region,
    });

    new random.provider.RandomProvider(this, "random");

    // Create random value
    const pet = new random.pet.Pet(this, "random-name", {
      length: 2,
    });

    // Create Lambda executable
    const asset = new TerraformAsset(this, "lambda-asset", {
      path: path.resolve(__dirname, config.path),
      type: AssetType.ARCHIVE, // if left empty it infers directory and file
    });

    // Create unique S3 bucket that hosts Lambda executable
    const bucket = new aws.s3Bucket.S3Bucket(this, "bucket", {
      bucketPrefix: `cdktf-auth-${name}`,
    });

    // Upload Lambda zip file to newly created S3 bucket
    const lambdaArchive = new aws.s3Object.S3Object(this, "lambda-archive", {
      bucket: bucket.bucket,
      key: `${config.version}/${asset.fileName}`,
      source: asset.path, // returns a posix path
    });

    // Create Lambda role
    const role = new aws.iamRole.IamRole(this, "lambda-exec", {
      name: `cdktf-auth-${name}-${pet.id}`,
      assumeRolePolicy: JSON.stringify(lambdaRolePolicy),
    });

    // Add execution role for lambda to write to CloudWatch logs
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "lambda-managed-policy",
      {
        policyArn:
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        role: role.name,
      }
    );

    // Create Lambda function
    const lambdaFunc = new aws.lambdaFunction.LambdaFunction(
      this,
      "auth-lambda-func",
      {
        functionName: `cdktf-${name}-${pet.id}`,
        s3Bucket: bucket.bucket,
        s3Key: lambdaArchive.key,
        handler: config.handler,
        runtime: config.runtime,
        role: role.arn,
      }
    );

    const { api, stage } = apiGatewayConfig(this, name, lambdaFunc.invokeArn);

    new aws.lambdaPermission.LambdaPermission(this, "apigw-lambda", {
      functionName: lambdaFunc.functionName,
      action: "lambda:InvokeFunction",
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });

    new TerraformOutput(this, "url", {
      value: `https://${api.id}.execute-api.${config.region}.amazonaws.com/${stage.stageName}`,
    });
  }
}

const app = new App();

new CognitoStack(app, "cognito-lamda");

new LambdaStack(app, "lambda-auth", {
  path: "../lambda-auth/dist",
  handler: "index.handler",
  runtime: "nodejs16.x",
  stageName: "auth",
  version: "v0.0.1",
  region: "us-east-1",
});

app.synth();
