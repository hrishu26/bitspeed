import express from 'express';
import bodyParser from 'body-parser';
import { identifyContact } from './controller';

const app = express();
app.use(bodyParser.json());

app.post('/identify', identifyContact);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bitespeed Identity Service listening on port ${PORT}`);
});