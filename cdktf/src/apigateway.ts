import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";
import { Fn, Token } from "cdktf";
import { Construct } from "constructs";

export const apiGatewayConfig = (
  instance: Construct,
  name: string,
  lambdaInvoke: string
) => {
  const api = new ApiGatewayRestApi(instance, "api-gw", {
    name: name,
    description: "API Gateway",
    endpointConfiguration: {
      types: ["REGIONAL"],
    },
  });

  const authenticateResource = new ApiGatewayResource(
    instance,
    "authenticate-user-resource",
    {
      parentId: api.rootResourceId,
      pathPart: "authenticate",
      restApiId: api.id,
    }
  );
  authenticateResource.overrideLogicalId(name);

  const authenticateMethod = new ApiGatewayMethod(
    instance,
    "AuthenticateUserApiGatewayMethod",
    {
      authorization: "NONE",
      httpMethod: "POST",
      resourceId: authenticateResource.id,
      restApiId: api.id,
    }
  );
  authenticateMethod.overrideLogicalId(name);

  const authenticateIntegration = new ApiGatewayIntegration(
    instance,
    "AuthenticateUserApiGatewayIntegration",
    {
      httpMethod: "POST",
      integrationHttpMethod: "POST",
      resourceId: authenticateResource.id,
      restApiId: api.id,
      type: "AWS_PROXY",
      uri: lambdaInvoke,
    }
  );
  authenticateIntegration.overrideLogicalId(name);

  const deployment = new ApiGatewayDeployment(instance, "api-gw-deployment", {
    restApiId: api.id,
    lifecycle: {
      createBeforeDestroy: true,
    },
    triggers: {
      redeployment: Token.asString(
        Fn.sha1(
          Token.asString(
            Fn.jsonencode([
              authenticateResource.id,
              authenticateMethod.id,
              authenticateIntegration.id,
            ])
          )
        )
      ),
    },
  });
  deployment.overrideLogicalId(name);

  const stage = new ApiGatewayStage(instance, "api-gw-stage", {
    deploymentId: deployment.id,
    restApiId: api.id,
    stageName: "v1",
  });
  stage.overrideLogicalId(name);

  return { api, stage };

  // const createUserResource = new aws.apiGatewayResource.ApiGatewayResource(
  //   instance,
  //   "create-user-resource",
  //   {
  //     parentId: api.rootResourceId,
  //     restApiId: api.id,
  //     pathPart: "create",
  //   }
  // );
  //
  // const createUserMethod = new aws.apiGatewayMethod.ApiGatewayMethod(
  //   instance,
  //   "CreateUserApiGatewayMethod",
  //   {
  //     restApiId: api.id,
  //     resourceId: createUserResource.id,
  //     httpMethod: "POST",
  //     authorization: "NONE",
  //   }
  // );
  //
  // new aws.apiGatewayIntegration.ApiGatewayIntegration(
  //   instance,
  //   "CreateUserApiGatewayIntegration",
  //   {
  //     restApiId: api.id,
  //     resourceId: createUserResource.id,
  //     httpMethod: createUserMethod.httpMethod,
  //     type: "AWS_PROXY",
  //     integrationHttpMethod: "POST",
  //     uri: lambdaFunc.invokeArn,
  //   }
  // );

  // Create and configure API gateway
  // const api = new aws.apigatewayv2Api.Apigatewayv2Api(instance, "api-gw", {
  //   name: name,
  //   protocolType: "HTTP",
  //   target: lambdaFunc.arn,
  // });

  // return { api, stage };
};
