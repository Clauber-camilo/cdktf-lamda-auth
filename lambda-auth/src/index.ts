import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { initializeConfig } from "./config/env";

AWS.config.update({ region: "us-east-1" });

const cognito = new AWS.CognitoIdentityServiceProvider();

const authenticate = async (event: {
  email: string;
  password: string;
}): Promise<APIGatewayProxyResult> => {
  console.info("lambda-auth: event ->", event);
  const { email, password } = event;

  const CONFIG = await initializeConfig();

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CONFIG.userPoolClientId, // replace with your Client ID
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  try {
    const data = await cognito.initiateAuth(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    };
  }
};
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.info("lambda-auth: event ->", event);
  const route = event.requestContext.resourcePath;
  const parsedBody = event.body ? JSON.parse(event.body) : {};

  console.info("lambda-auth: route ->", route);

  if (route === "/authenticate") {
    return authenticate(parsedBody);
  }

  return {
    statusCode: 404,
    body: "Not Found",
  };
};
