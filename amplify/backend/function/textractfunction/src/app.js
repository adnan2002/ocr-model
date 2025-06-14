/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const { TextractClient, DetectDocumentTextCommand } = require("@aws-sdk/client-textract");

// The Textract client, configured to use the region from environment variables
const textractClient = new TextractClient({ region: process.env.REGION });

// Declare a new express app
const app = express();
// Increase the body size limit to handle base64 encoded images
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// This is the main endpoint that will process the image
app.post('/ocr', async (req, res) => {
  // Check if the image data exists in the request body
  if (!req.body.image) {
    return res.status(400).json({ error: 'No image data provided in the request body' });
  }

  try {
    // The image from the React app is a base64 string. We need to decode it into bytes (a Buffer).
    const imageBytes = Buffer.from(req.body.image, 'base64');

    // Prepare the command for the Textract API
    const params = {
      Document: {
        Bytes: imageBytes,
      },
    };

    const command = new DetectDocumentTextCommand(params);
    const data = await textractClient.send(command);

    // Process the response from Textract
    if (data.Blocks && data.Blocks.length > 0) {
      // Filter out only the lines of text and join them together
      const extractedText = data.Blocks
        .filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n');
      
      res.json({ success: 'Text extracted successfully', text: extractedText });
    } else {
      // Handle cases where Textract finds no text
      res.json({ success: 'No text found', text: '' });
    }
  } catch (error) {
    // Handle any errors from the AWS Textract API
    console.error('Textract Error:', error);
    res.status(500).json({ error: 'Failed to process image with AWS Textract', message: error.message });
  }
});

app.listen(3000, function() {
    console.log("App started");
});

// Export the app object for AWS Lambda
module.exports = app;