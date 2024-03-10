import * as AWS from "aws-sdk";

const ssm = new AWS.SSM();

async function getParameter(name: string) {
  const response = await ssm
    .getParameter({ Name: name, WithDecryption: true })
    .promise();

  return response.Parameter?.Value || "";
}

interface IEnv {
  userPoolId: string;
  userPoolClientId: string;
}

const CONFIG: IEnv = {
  userPoolId: process.env.USER_POOL_ID || "user_pool_id",
  userPoolClientId: process.env.USER_POOL_CLIENT_ID || "user_pool_client_id",
};

const initializeConfig = async () => {
  CONFIG.userPoolId = await getParameter("/lambda-auth/userPoolId");
  CONFIG.userPoolClientId = await getParameter("/lambda-auth/userPoolClientId");

  return CONFIG;
};

export { initializeConfig, CONFIG };
