import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";

AWS.config.update({ region: "us-east-1" });

const cognito = new AWS.CognitoIdentityServiceProvider();

const createUser = async (event: {
  email: string;
  cpf: string;
  password: string;
}): Promise<APIGatewayProxyResult> => {
  const { email, cpf, password } = event;

  const params = {
    UserPoolId: "your_user_pool_id", // replace with your User Pool ID
    Username: cpf,
    TemporaryPassword: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "email_verified",
        Value: "true",
      },
    ],
    MessageAction: "SUPPRESS", // suppresses the welcome message
  };

  try {
    await cognito.adminCreateUser(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User created successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    };
  }
};

const authenticate = async (event: {
  cpf: string;
  password: string;
}): Promise<APIGatewayProxyResult> => {
  console.info("lambda-auth: event ->", event);
  const { cpf, password } = event;

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: "2k9msi4564g5c2r1fbepgj7b8o", // replace with your Client ID
    AuthParameters: {
      USERNAME: cpf,
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
  const route = event.requestContext.path;
  const parsedBody = event.body ? JSON.parse(event.body) : {};

  console.info("lambda-auth: route ->", route);

  if (route === "/createUser") {
    return createUser(parsedBody);
  } else if (route === "/authenticate") {
    return authenticate(parsedBody);
  } else {
    return {
      statusCode: 404,
      body: "Not Found",
    };
  }
};
