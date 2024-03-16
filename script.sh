cd lambda-auth && npm run build
cd ..
cp -r lambda-auth/dist cdktf/lambda-out
cd cdktf
