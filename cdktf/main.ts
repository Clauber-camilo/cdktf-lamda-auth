import { App } from "cdktf";
import { LambdaStack } from "./src/stacks/lambda";

const app = new App();

new LambdaStack(app, "lambda-auth", {
  path: "../../lambda-out",
  handler: "index.handler",
  runtime: "nodejs16.x",
  stageName: "auth",
  version: "v0.1",
  region: "us-east-1",
});

app.synth();
