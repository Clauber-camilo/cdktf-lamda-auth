# Project Title: Lambda Authentication with Cognito using Terraform CDK

This project uses the Cloud Development Kit for Terraform (CDKTF) to deploy an AWS Lambda function integrated with Amazon Cognito for user authentication.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- AWS CLI
- Terraform
- CDK for Terraform CLI

### Installation

1. Clone the repository:

````bash
git clone https://github.com/Clauber-camilo/cdktf-lamda-auth.git```

2. Navigate to the project directory:
```bash
cd cdktf-lamd-auth
````

3. Compile the TypeScript application:

```bash
cd lambda-auth
npm install
npm run build

```

4. Install the dependencies to cdktf:

```bash
cd ..
cd cdktf
npm install
```

5. Generate Terraform configuration:

```bash
cdktf get
```

6. Deploy the stack:

```bash
cdktf deploy
```

## Usage

After deployment, you can use the AWS Lambda function with Cognito for user authentication.

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.

## Acknowledgments

- AWS CDKTF
- AWS Lambda
- Amazon Cognito

## Contact

If you have any questions, feel free to reach out to us.
