const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const fs = require('fs');
const credentials = require('./credentials');

AWS.config.update({
  region: credentials.region,
  accessKeyId: credentials.accessKey,
  secretAccessKey: credentials.secretKey
});

const s3 = new AWS.S3();
const app = express();

app.use(fileUpload({
  createParentPath: true
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/upload', async function (req, res) {
  try {
    if (!req.files || !req.files.file) {
      throw new Error('No file uploaded');
    }

    console.log(`Uploaded file: ${req.files.file.mimetype} ${req.files.file.size} bytes`);
    const fileId = new Date().getTime().toString();
    const fileName = `${fileId}.jpg`;
    
    await req.files.file.mv(`uploads/${fileName}`);

    const bucketParams = {
      ACL: 'public-read',
      Bucket: credentials.bucket,
    };
    await s3.createBucket(bucketParams).promise();

    const uploadParams = {
      ACL: 'public-read',
      Bucket: credentials.bucket,
      Key: fileName,
      Body: req.files.file.data
    };
    const upload = await s3.upload(uploadParams).promise();
    console.log(upload.Location);

    res.send(upload.Location);
  } catch (err) {
    console.log(err);
    res.send(`rejected: ${JSON.stringify(err)}`);
  }
});

app.listen(9200, function () {
  console.log('App listening on port 9200!');
});

