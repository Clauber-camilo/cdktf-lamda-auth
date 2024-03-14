import { App } from "cdktf";
import { CognitoStack } from "./src/stacks/cognito";
import { LambdaStack } from "./src/stacks/lambda";

const app = new App();

new CognitoStack(app, "cognito-lambda");

new LambdaStack(app, "lambda-auth", {
  path: "../../../lambda-auth/dist",
  handler: "index.handler",
  runtime: "nodejs16.x",
  stageName: "auth",
  version: "v0.1",
  region: "us-east-1",
});

app.synth();
